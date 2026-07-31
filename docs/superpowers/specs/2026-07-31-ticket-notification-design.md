# Ticket Notification System Design

## Overview

Add push notification support for users who enter a ticket number in the store detail modal. When a user's ticket is within a few groups of being called, the system sends a browser push notification prompting them to head to the store.

## Goals

- Notify users proactively when their ticket is almost called
- Zero-config experience — no settings UI, tiered fixed thresholds
- Works when the tab is closed (true push notifications)
- Stateless backend pattern preserved — Vercel KV for registration storage, serverless functions for API

## Non-Goals

- User accounts or authentication
- Email/SMS notifications
- Customizable notification thresholds (may be added later)

---

## Data Model

**Vercel KV key patterns:**

```
notification:{subscriptionId}
  → {
      subscription: PushSubscription,  // browser push subscription (endpoint, keys)
      storeId: number,                 // which store
      ticketNumber: number,            // user's ticket number
      createdAt: number                // timestamp for TTL cleanup
    }

notification:store:{storeId}
  → [subscriptionId, ...]             // secondary index: all registrations for a store

notification:index
  → [storeId, ...]                    // global index: stores with active registrations
```

**Why this structure:**
- Keyed by subscription ID (derived from push endpoint) so each browser subscription is unique
- Secondary index enables efficient lookup: cron reads store index → gets subscriptions → reads each registration
- Global index lets cron iterate only stores with active registrations (not all 44)
- `createdAt` enables 4-hour TTL expiry, pruned during cron runs

---

## API Routes

### `POST /api/register`

**Request:**
```json
{
  "subscription": { "endpoint": "...", "keys": { "p256dh": "...", "auth": "..." } },
  "storeId": 123,
  "ticketNumber": 45
}
```

**Response:**
```json
{
  "success": true,
  "registrationId": "abc123"
}
```

**Logic:**
1. Generate subscription ID from push endpoint (hash or base64)
2. Save `notification:{subId}` with subscription, storeId, ticketNumber, createdAt
3. Append subId to `notification:store:{storeId}`
4. Add storeId to `notification:index` if not present
5. Return registrationId

### `GET /api/notify` (cron-triggered)

**Logic:**
1. Read `notification:index` → list of store IDs with active registrations
2. For each store:
   a. Fetch live queue via `getQueueData(storeId)`
   b. Read `notification:store:{storeId}` → list of subscription IDs
   c. For each subscription:
      - Read `notification:{subId}` → get ticketNumber, subscription, createdAt
      - Skip if expired (createdAt + 4 hours < now)
      - Calculate position: `ticketNumber - max(calledNumbers)` from queue data
      - Determine threshold tier and send push:
        - `position <= 0`: "已經到你了！/ Your ticket is being called!"
        - `position <= 1`: "快到你了！/ Almost your turn!"
        - `position <= 3`: "你排前面還有 {n} 組 / {n} groups ahead of you"
      - Prune registration from KV if ticket already called or expired
3. Return 200 OK

**Cron schedule:** Every 5 minutes via Vercel Cron

### `DELETE /api/register` (optional)

**Request:**
```json
{
  "registrationId": "abc123"
}
```

**Logic:**
1. Read registration to get storeId
2. Remove `notification:{subId}` from KV
3. Remove subId from `notification:store:{storeId}`
4. Optionally remove storeId from `notification:index` if no registrations remain

---

## Service Worker

**`public/sw.js` additions:**

```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: `ticket-${data.storeId}`,
    renotify: true,
    data: { url: `/store/${data.storeId}` }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data.url;
  event.waitUntil(clients.openWindow(url));
});
```

**Push payload:**
```json
{
  "title": "壽司郎排隊通知",
  "body": "你排前面還有 2 組 / 2 groups ahead of you",
  "storeId": 123
}
```

---

## Client-Side Flow

1. User opens store detail modal → enters ticket number in calculator
2. Calculator shows groups ahead (existing behavior)
3. **New:** "通知我 / Notify me" button appears below result (only when valid ticket + groups > 0)
4. User clicks button → browser prompts for notification permission
5. If granted:
   - `pushManager.subscribe()` creates PushSubscription
   - POST to `/api/register` with subscription + storeId + ticketNumber
   - Button changes to "通知中 ✓ / Notifying" with cancel option
   - Toast confirms: "已開啟通知 / Notifications enabled"
6. If denied:
   - Toast: "請在瀏覽器設定中開啟通知權限 / Enable notifications in browser settings"

**State persistence:**
- Active registration ID stored in `localStorage` keyed by store ID
- On app load, check if registration still valid
- If user changes ticket number, prompt to update registration

---

## UI Components

### New files

- `src/components/NotificationBell.tsx` — toggle button for notification subscription
- `src/utils/push.ts` — helper functions for push subscription management

### Modified files

- `src/components/StoreDetailModal.tsx` — integrate NotificationBell below ticket calculator
- `public/sw.js` — add push notification event listeners
- `vercel.json` — add cron configuration
- `api/register.ts` — new: handle registration
- `api/notify.ts` — new: cron-triggered notification sender

### NotificationBell component

States:
- **idle:** "通知我 / Notify me" button (primary style)
- **subscribed:** "通知中 ✓ / Notifying" button (outline style) with cancel
- **loading:** spinner while registering

Only renders when:
- A valid ticket number is entered in the calculator
- Groups ahead > 0 (no point notifying if ticket is already called)

---

## Threshold Logic

Notification tiers (fixed, not configurable):

| Condition | Notification | Purpose |
|-----------|-------------|---------|
| `position <= 3` | "你排前面還有 {n} 組" | Heads up — start wrapping up |
| `position <= 1` | "快到你了！" | Action — start walking to store |
| `position <= 0` | "已經到你了！" | Urgent — your ticket is being called |

**Position calculation:**
```
calledNumbers = [...boothQueue, ...counterQueue].map(Number)
maxCalled = Math.max(...calledNumbers)
position = ticketNumber - maxCalled
```

If ticket number is below all called numbers, position is negative (already called).

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Store closes | Registrations auto-expire via TTL, no special handling |
| Ticket already called | Send "already called" notification, prune registration |
| Queue resets (new day) | Registrations with ticket numbers above max called get reset notification |
| User unsubscribes | DELETE /api/register removes from KV |
| Duplicate registration | Overwrite existing registration for same subscription |
| KV storage limit | TTL pruning keeps storage bounded; 4-hour expiry is aggressive enough |

---

## Infrastructure

### Environment variables

```
KV_REST_API_URL=        # Vercel KV REST API URL
KV_REST_API_TOKEN=      # Vercel KV REST API token
VAPID_PUBLIC_KEY=       # Web Push VAPID public key
VAPID_PRIVATE_KEY=      # Web Push VAPID private key
VAPID_EMAIL=            # Contact email for VAPID (e.g., mailto:admin@example.com)
```

### VAPID key generation

```bash
npx web-push generate-vapid-keys
```

Generated once, stored in Vercel environment variables.

### Vercel KV setup

```bash
npx vercel kv link
```

Creates the KV store linked to the project.

### Cron configuration (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/notify",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## Dependencies

New npm packages:
- `web-push` — server-side Web Push API implementation for sending notifications

No other new dependencies. Uses existing Vercel KV integration.

---

## Testing

1. **Unit tests:**
   - `push.ts` — test subscription serialization, permission states
   - Position calculation logic — test threshold tiers with mock queue data

2. **Integration tests:**
   - `/api/register` — test registration creation, duplicate handling
   - `/api/notify` — test cron execution with mock KV and queue data

3. **Manual testing:**
   - Register for notifications on a store with short queue
   - Wait for cron to fire (or trigger manually)
   - Verify push notification appears
   - Click notification → app opens to store detail

---

## Rollout

1. Generate VAPID keys and configure env vars
2. Set up Vercel KV
3. Deploy with new API routes and service worker
4. Test with a single store before enabling cron
5. Monitor KV usage and notification delivery rates
