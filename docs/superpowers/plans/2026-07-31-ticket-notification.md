# Ticket Notification System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add browser push notifications that alert users when their Sushiro ticket number is within 3 groups of being called.

**Architecture:** Client-side `NotificationBell` component requests push permission and registers via `POST /api/register`. Serverless cron (`GET /api/notify`) checks queue progression against registered tickets in Vercel KV and sends Web Push when thresholds are hit. Service worker displays the notification.

**Tech Stack:** React 19, TypeScript, Vite, Vercel Serverless Functions, Vercel KV, Web Push API (via `web-push` npm package), Service Worker.

## Global Constraints

- TypeScript strict mode, Vite build, deployed to Vercel
- Existing API pattern: `api/*.ts` with `VercelRequest`/`VercelResponse` from `@vercel/node`
- CORS enabled on all API routes (`Access-Control-Allow-Origin: *`)
- Bilingual UI: Chinese primary, English secondary
- Tailwind CSS 4.x utility classes, `motion` (framer-motion) for animations
- No new UI libraries — use existing Tailwind + lucide-react icons

---

## File Structure

| File | Role |
|------|------|
| `src/utils/push.ts` | **Create.** Client helpers: check permission, subscribe to push, unsubscribe, serialize subscription |
| `src/components/NotificationBell.tsx` | **Create.** Toggle button: idle → subscribed → loading states |
| `api/register.ts` | **Create.** POST handler: save subscription + storeId + ticketNumber to KV |
| `api/notify.ts` | **Create.** GET handler (cron): check queues, send pushes, prune expired |
| `api/_lib/kv.ts` | **Create.** Shared KV client wrapper using `@vercel/kv` |
| `api/_lib/push.ts` | **Create.** Server-side Web Push helper using `web-push` library |
| `public/sw.js` | **Modify.** Add `push` and `notificationclick` event listeners |
| `src/components/StoreDetailModal.tsx` | **Modify.** Integrate `NotificationBell` below ticket calculator |
| `vercel.json` | **Modify.** Add cron schedule for `/api/notify` |
| `package.json` | **Modify.** Add `web-push` and `@vercel/kv` dependencies |
| `src/utils/push.test.ts` | **Create.** Unit tests for client push helpers |
| `api/notify.test.ts` | **Create.** Unit tests for notification threshold logic |

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install web-push and @vercel/kv**

```bash
npm install web-push @vercel/kv
```

- [ ] **Step 2: Install @vercel/kv types (if not included)**

```bash
npm install -D @types/web-push
```

- [ ] **Step 3: Verify installation**

```bash
npm ls web-push @vercel/kv
```

Expected: both packages listed without errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add web-push and @vercel/kv dependencies"
```

---

### Task 2: KV Client Wrapper

**Files:**
- Create: `api/_lib/kv.ts`

**Interfaces:**
- Produces: `kvGet<T>(key: string): Promise<T | null>`, `kvSet(key: string, value: unknown): Promise<void>`, `kvDel(key: string): Promise<void>`, `kvKeys(pattern: string): Promise<string[]>`

- [ ] **Step 1: Create KV client wrapper**

```typescript
// api/_lib/kv.ts
import { kv } from '@vercel/kv';

export async function kvGet<T>(key: string): Promise<T | null> {
  return kv.get<T>(key);
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await kv.set(key, value);
}

export async function kvDel(key: string): Promise<void> {
  await kv.del(key);
}

export async function kvKeys(pattern: string): Promise<string[]> {
  return kv.keys(pattern);
}
```

- [ ] **Step 2: Commit**

```bash
git add api/_lib/kv.ts
git commit -m "feat: add Vercel KV client wrapper"
```

---

### Task 3: Server-Side Push Helper

**Files:**
- Create: `api/_lib/push.ts`

**Interfaces:**
- Consumes: `PushSubscription` from web-push
- Produces: `sendPushNotification(subscription: PushSubscription, payload: object): Promise<void>`

- [ ] **Step 1: Create push notification sender**

```typescript
// api/_lib/push.ts
import webPush from 'web-push';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@sushiro-hk.vercel.app';

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: Record<string, unknown>
): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('[Push] VAPID keys not configured, skipping push');
    return;
  }

  try {
    await webPush.sendNotification(
      subscription,
      JSON.stringify(payload),
      { TTL: 60 * 5 } // 5 min TTL
    );
  } catch (err: any) {
    // 404 = subscription expired, 410 = subscription gone
    if (err.statusCode === 404 || err.statusCode === 410) {
      console.log('[Push] Subscription expired, should prune');
      throw new Error('SUBSCRIPTION_EXPIRED');
    }
    console.error('[Push] Send failed:', err.message || err);
    throw err;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add api/_lib/push.ts
git commit -m "feat: add server-side push notification helper"
```

---

### Task 4: Register API Route

**Files:**
- Create: `api/register.ts`
- Modify: `api/_lib/kv.ts` (if needed for batch operations)

**Interfaces:**
- Consumes: `PushSubscription` from Task 3
- Produces: `POST /api/register` → `{ success: boolean, registrationId: string }`

- [ ] **Step 1: Create register API handler**

```typescript
// api/register.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kvGet, kvSet } from './_lib/kv.js';
import { createHash } from 'crypto';

interface RegistrationRequest {
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  storeId: number;
  ticketNumber: number;
}

function generateSubscriptionId(endpoint: string): string {
  return createHash('sha256').update(endpoint).digest('hex').slice(0, 16);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const body = req.body as RegistrationRequest;

  if (!body?.subscription?.endpoint || !body?.storeId || !body?.ticketNumber) {
    return res.status(400).json({
      success: false,
      error: '缺少必要欄位：subscription, storeId, ticketNumber',
    });
  }

  if (body.storeId < 1 || body.ticketNumber < 1) {
    return res.status(400).json({
      success: false,
      error: 'storeId 和 ticketNumber 必須為正整數',
    });
  }

  try {
    const subId = generateSubscriptionId(body.subscription.endpoint);
    const now = Date.now();
    const TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

    const registration = {
      subscription: body.subscription,
      storeId: body.storeId,
      ticketNumber: body.ticketNumber,
      createdAt: now,
      expiresAt: now + TTL_MS,
    };

    // Save registration
    await kvSet(`notification:${subId}`, registration);

    // Update store index
    const storeKey = `notification:store:${body.storeId}`;
    const existingIds = await kvGet<string[]>(storeKey) || [];
    if (!existingIds.includes(subId)) {
      existingIds.push(subId);
      await kvSet(storeKey, existingIds);
    }

    // Update global index
    const globalIndexKey = 'notification:index';
    const storeIds = await kvGet<number[]>(globalIndexKey) || [];
    if (!storeIds.includes(body.storeId)) {
      storeIds.push(body.storeId);
      await kvSet(globalIndexKey, storeIds);
    }

    return res.json({
      success: true,
      registrationId: subId,
    });
  } catch (err: any) {
    console.error('[Register Error]', err.message || err);
    return res.status(500).json({
      success: false,
      error: '註冊失敗，請稍後再試',
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add api/register.ts
git commit -m "feat: add POST /api/register endpoint for push subscriptions"
```

---

### Task 5: Notification Threshold Logic (with tests)

**Files:**
- Create: `api/_lib/notify-logic.ts`
- Create: `api/_lib/notify-logic.test.ts`

**Interfaces:**
- Consumes: ticket number (number), queue data (`GroupQueue`)
- Produces: `{ shouldNotify: boolean, tier: 'called' | 'almost' | 'close' | 'none', position: number, message: string }`

- [ ] **Step 1: Write failing test**

```typescript
// api/_lib/notify-logic.test.ts
import { describe, it, expect } from 'vitest';
import { calculateTicketPosition, getNotificationTier } from './notify-logic';

describe('calculateTicketPosition', () => {
  it('returns negative when ticket is already called', () => {
    const queue = { boothQueue: ['10', '11', '12'], counterQueue: ['10', '11'] };
    expect(calculateTicketPosition(10, queue)).toBe(-2);
  });

  it('returns 0 when ticket is next', () => {
    const queue = { boothQueue: ['10', '11'], counterQueue: ['10'] };
    expect(calculateTicketPosition(12, queue)).toBe(0);
  });

  it('returns positive when ticket is ahead', () => {
    const queue = { boothQueue: ['10'], counterQueue: ['10'] };
    expect(calculateTicketPosition(15, queue)).toBe(5);
  });

  it('handles empty queues', () => {
    const queue = { boothQueue: [], counterQueue: [] };
    expect(calculateTicketPosition(5, queue)).toBe(5);
  });

  it('handles reservation numbers (>= 1000) by excluding them', () => {
    const queue = { boothQueue: ['10', '1001'], counterQueue: ['10'] };
    expect(calculateTicketPosition(12, queue)).toBe(2);
  });
});

describe('getNotificationTier', () => {
  it('returns "called" for position <= 0', () => {
    expect(getNotificationTier(0)).toEqual({
      shouldNotify: true,
      tier: 'called',
      message: '已經到你了！/ Your ticket is being called!',
    });
  });

  it('returns "almost" for position 1', () => {
    expect(getNotificationTier(1)).toEqual({
      shouldNotify: true,
      tier: 'almost',
      message: '快到你了！/ Almost your turn!',
    });
  });

  it('returns "close" for position 2-3', () => {
    const result2 = getNotificationTier(2);
    const result3 = getNotificationTier(3);
    expect(result2.shouldNotify).toBe(true);
    expect(result2.tier).toBe('close');
    expect(result3.shouldNotify).toBe(true);
    expect(result3.tier).toBe('close');
    expect(result2.message).toContain('2 組');
    expect(result3.message).toContain('3 組');
  });

  it('returns "none" for position > 3', () => {
    expect(getNotificationTier(5)).toEqual({
      shouldNotify: false,
      tier: 'none',
      message: '',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run api/_lib/notify-logic.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement threshold logic**

```typescript
// api/_lib/notify-logic.ts
import { GroupQueue } from '../../src/types';

export interface NotificationTier {
  shouldNotify: boolean;
  tier: 'called' | 'almost' | 'close' | 'none';
  position: number;
  message: string;
}

export function calculateTicketPosition(
  ticketNumber: number,
  queue: Pick<GroupQueue, 'boothQueue' | 'counterQueue' | 'storeBoothQueue' | 'storeCounterQueue' | 'storeQueue' | 'mixedQueue'>
): number {
  const calledNumbers = [
    ...(queue.boothQueue || []),
    ...(queue.counterQueue || []),
    ...(queue.storeBoothQueue || []),
    ...(queue.storeCounterQueue || []),
    ...(queue.storeQueue || []),
    ...(queue.mixedQueue || []),
  ]
    .map((n) => parseInt(n.replace(/^#/, ''), 10))
    .filter((n) => !isNaN(n) && n < 1000); // exclude reservation numbers (>= 1000)

  if (calledNumbers.length === 0) return ticketNumber;

  const maxCalled = Math.max(...calledNumbers);
  return ticketNumber - maxCalled;
}

export function getNotificationTier(position: number): NotificationTier {
  if (position <= 0) {
    return {
      shouldNotify: true,
      tier: 'called',
      position,
      message: '已經到你了！/ Your ticket is being called!',
    };
  }
  if (position <= 1) {
    return {
      shouldNotify: true,
      tier: 'almost',
      position,
      message: '快到你了！/ Almost your turn!',
    };
  }
  if (position <= 3) {
    return {
      shouldNotify: true,
      tier: 'close',
      position,
      message: `你排前面還有 ${position} 組 / ${position} groups ahead of you`,
    };
  }
  return {
    shouldNotify: false,
    tier: 'none',
    position,
    message: '',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run api/_lib/notify-logic.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/_lib/notify-logic.ts api/_lib/notify-logic.test.ts
git commit -m "feat: add notification threshold logic with tests"
```

---

### Task 6: Notify API Route (Cron Handler)

**Files:**
- Create: `api/notify.ts`

**Interfaces:**
- Consumes: KV data (registrations, indices), `getQueueData` from cache, `sendPushNotification` from Task 3, threshold logic from Task 5
- Produces: sends push notifications, prunes expired registrations

- [ ] **Step 1: Create notify API handler**

```typescript
// api/notify.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kvGet, kvSet, kvDel } from './_lib/kv.js';
import { sendPushNotification } from './_lib/push.js';
import { calculateTicketPosition, getNotificationTier } from './_lib/notify-logic.js';
import { getQueueData } from './_lib/cache.js';

const TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

interface Registration {
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  storeId: number;
  ticketNumber: number;
  createdAt: number;
  expiresAt: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret or allow manual trigger
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const results = { checked: 0, notified: 0, pruned: 0, errors: 0 };

  try {
    // Get list of stores with active registrations
    const storeIds = await kvGet<number[]>('notification:index') || [];

    for (const storeId of storeIds) {
      const storeKey = `notification:store:${storeId}`;
      const subIds = await kvGet<string[]>(storeKey) || [];

      if (subIds.length === 0) {
        // No registrations for this store, clean up index
        const updatedStoreIds = storeIds.filter((id) => id !== storeId);
        await kvSet('notification:index', updatedStoreIds);
        continue;
      }

      // Fetch live queue data
      let queueData;
      try {
        const result = await getQueueData(String(storeId), true);
        queueData = result.data;
      } catch {
        console.warn(`[Notify] Failed to fetch queue for store ${storeId}, skipping`);
        continue;
      }

      const survivingSubIds: string[] = [];

      for (const subId of subIds) {
        results.checked++;

        const reg = await kvGet<Registration>(`notification:${subId}`);
        if (!reg) {
          results.pruned++;
          continue;
        }

        // Check TTL
        if (Date.now() > reg.expiresAt) {
          await kvDel(`notification:${subId}`);
          results.pruned++;
          continue;
        }

        // Calculate position
        const position = calculateTicketPosition(reg.ticketNumber, queueData);
        const tier = getNotificationTier(position);

        if (tier.shouldNotify) {
          try {
            await sendPushNotification(reg.subscription, {
              title: '壽司郎排隊通知',
              body: tier.message,
              storeId: storeId,
            });
            results.notified++;
          } catch (err: any) {
            if (err.message === 'SUBSCRIPTION_EXPIRED') {
              await kvDel(`notification:${subId}`);
              results.pruned++;
              continue;
            }
            console.error(`[Notify] Push failed for ${subId}:`, err.message);
            results.errors++;
          }
        }

        // Prune if ticket already called
        if (tier.tier === 'called') {
          await kvDel(`notification:${subId}`);
          results.pruned++;
        } else {
          survivingSubIds.push(subId);
        }
      }

      // Update store index with surviving registrations
      if (survivingSubIds.length === 0) {
        await kvDel(storeKey);
        const updatedStoreIds = storeIds.filter((id) => id !== storeId);
        await kvSet('notification:index', updatedStoreIds);
      } else {
        await kvSet(storeKey, survivingSubIds);
      }
    }

    return res.json({ success: true, ...results });
  } catch (err: any) {
    console.error('[Notify Error]', err.message || err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add api/notify.ts
git commit -m "feat: add GET /api/notify cron handler for push delivery"
```

---

### Task 7: Client-Side Push Helpers

**Files:**
- Create: `src/utils/push.ts`
- Create: `src/utils/push.test.ts`

**Interfaces:**
- Produces: `getNotificationPermission()`, `requestPushSubscription()`, `isPushSupported()`, `getStoredRegistration(storeId)`, `storeRegistration(storeId, registrationId)`, `removeRegistration(storeId)`

- [ ] **Step 1: Write failing test**

```typescript
// src/utils/push.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isPushSupported, getNotificationPermission } from './push';

describe('isPushSupported', () => {
  it('returns false when navigator is undefined (SSR)', () => {
    expect(isPushSupported()).toBe(false);
  });
});

describe('getNotificationPermission', () => {
  it('returns "denied" when Notification is not available', () => {
    expect(getNotificationPermission()).toBe('denied');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/utils/push.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement client push helpers**

```typescript
// src/utils/push.ts
const REGISTRATION_STORAGE_KEY = 'sushiro_hk_push_registrations';

export function isPushSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof Notification === 'undefined') return 'denied';
  return Notification.permission;
}

export async function requestPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
    ),
  });

  return subscription;
}

export function serializeSubscription(subscription: PushSubscription) {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.getKey('p256dh')
        ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!)))
        : '',
      auth: subscription.getKey('auth')
        ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
        : '',
    },
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface StoredRegistration {
  storeId: number;
  registrationId: string;
  ticketNumber: number;
  timestamp: number;
}

export function getStoredRegistration(storeId: number): StoredRegistration | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(REGISTRATION_STORAGE_KEY);
    if (!raw) return null;
    const map: Record<number, StoredRegistration> = JSON.parse(raw);
    return map[storeId] || null;
  } catch {
    return null;
  }
}

export function storeRegistration(storeId: number, registrationId: string, ticketNumber: number): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(REGISTRATION_STORAGE_KEY);
    const map: Record<number, StoredRegistration> = raw ? JSON.parse(raw) : {};
    map[storeId] = { storeId, registrationId, ticketNumber, timestamp: Date.now() };
    localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage full or unavailable
  }
}

export function removeRegistration(storeId: number): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(REGISTRATION_STORAGE_KEY);
    if (!raw) return;
    const map: Record<number, StoredRegistration> = JSON.parse(raw);
    delete map[storeId];
    localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/utils/push.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/push.ts src/utils/push.test.ts
git commit -m "feat: add client-side push subscription helpers with tests"
```

---

### Task 8: NotificationBell Component

**Files:**
- Create: `src/components/NotificationBell.tsx`

**Interfaces:**
- Consumes: `requestPushSubscription`, `serializeSubscription`, `storeRegistration`, `removeRegistration`, `getStoredRegistration` from Task 7
- Produces: `<NotificationBell storeId={number} ticketNumber={number} groupsAhead={number} onToast={function} />`

- [ ] **Step 1: Create NotificationBell component**

```tsx
// src/components/NotificationBell.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import {
  isPushSupported,
  getNotificationPermission,
  requestPushSubscription,
  serializeSubscription,
  getStoredRegistration,
  storeRegistration,
  removeRegistration,
} from '../utils/push';

interface NotificationBellProps {
  storeId: number;
  ticketNumber: number;
  groupsAhead: number;
  onToast: (text: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  storeId,
  ticketNumber,
  groupsAhead,
  onToast,
}) => {
  const [state, setState] = useState<'idle' | 'loading' | 'subscribed'>('idle');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isPushSupported());
    const existing = getStoredRegistration(storeId);
    if (existing && existing.ticketNumber === ticketNumber) {
      setState('subscribed');
    }
  }, [storeId, ticketNumber]);

  const handleSubscribe = useCallback(async () => {
    if (!supported) {
      onToast('您的瀏覽器不支援推播通知', 'warning');
      return;
    }

    const permission = getNotificationPermission();
    if (permission === 'denied') {
      onToast('請在瀏覽器設定中開啟通知權限', 'warning');
      return;
    }

    setState('loading');

    try {
      const subscription = await requestPushSubscription();
      if (!subscription) {
        onToast('通知權限被拒絕', 'warning');
        setState('idle');
        return;
      }

      const serialized = serializeSubscription(subscription);
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: serialized,
          storeId,
          ticketNumber,
        }),
      });

      const data = await res.json();
      if (data.success) {
        storeRegistration(storeId, data.registrationId, ticketNumber);
        setState('subscribed');
        onToast('已開啟通知 / Notifications enabled', 'success');
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error('[NotificationBell] Subscribe error:', err);
      onToast('註冊通知失敗，請稍後再試', 'error');
      setState('idle');
    }
  }, [supported, storeId, ticketNumber, onToast]);

  const handleUnsubscribe = useCallback(() => {
    removeRegistration(storeId);
    setState('idle');
    onToast('已關閉通知 / Notifications disabled', 'info');
  }, [storeId, onToast]);

  // Don't show if ticket is already called or no groups ahead
  if (groupsAhead <= 0) return null;

  // Don't show if browser doesn't support push
  if (!supported) return null;

  if (state === 'subscribed') {
    return (
      <button
        onClick={handleUnsubscribe}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:border-[#aa151b] hover:text-[#aa151b] transition-all text-sm font-bold cursor-pointer"
      >
        <BellOff className="w-4 h-4" />
        <span>通知中 ✓ / Notifying</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={state === 'loading'}
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#aa151b] hover:bg-red-700 text-white transition-all text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {state === 'loading' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
      <span>通知我 / Notify me</span>
    </button>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NotificationBell.tsx
git commit -m "feat: add NotificationBell component for push subscription UI"
```

---

### Task 9: Integrate NotificationBell into StoreDetailModal

**Files:**
- Modify: `src/components/StoreDetailModal.tsx`

- [ ] **Step 1: Add import and integrate component**

In `src/components/StoreDetailModal.tsx`, add import at top:

```typescript
import { NotificationBell } from './NotificationBell';
```

Add the `showToast` prop to `StoreDetailModalProps` interface:

```typescript
interface StoreDetailModalProps {
  // ... existing props ...
  onToast?: (text: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}
```

Then, after the ticket calculator section (after the closing `</div>` of the calculator section around line 380), before the scrollable content area closes, add the NotificationBell:

```tsx
{/* Notification Bell */}
{ticketValidationState === 'valid' && groupsAhead > 0 && (
  <div className="px-5 sm:px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
    <NotificationBell
      storeId={store.id}
      ticketNumber={myTicketNum}
      groupsAhead={groupsAhead}
      onToast={onToast || (() => {})}
    />
  </div>
)}
```

- [ ] **Step 2: Verify the modal compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/StoreDetailModal.tsx
git commit -m "feat: integrate NotificationBell into StoreDetailModal"
```

---

### Task 10: Service Worker Push Handlers

**Files:**
- Modify: `public/sw.js`

- [ ] **Step 1: Add push event listeners to sw.js**

Append to the end of `public/sw.js`:

```javascript
// Push Notification Handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title || '壽司郎排隊通知', {
      body: data.body || '',
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: `ticket-${data.storeId}`,
      renotify: true,
      data: { url: `/` },
    })
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      return clients.openWindow(url);
    })
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add public/sw.js
git commit -m "feat: add push and notificationclick handlers to service worker"
```

---

### Task 11: Vercel Configuration

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Add cron configuration to vercel.json**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "crons": [
    {
      "path": "/api/notify",
      "schedule": "*/5 * * * *"
    }
  ],
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "chore: add cron schedule for /api/notify"
```

---

### Task 12: Type Exports and Environment Variables

**Files:**
- Modify: `src/types.ts`
- Create: `.env.example` (if not exists)

- [ ] **Step 1: Add NotificationRegistration type to types.ts**

```typescript
export interface NotificationRegistration {
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  storeId: number;
  ticketNumber: number;
  createdAt: number;
  expiresAt: number;
}
```

- [ ] **Step 2: Update .env.example with required variables**

```bash
# Vercel KV
KV_REST_API_URL=
KV_REST_API_TOKEN=

# VAPID keys (generate with: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:admin@example.com

# Cron secret (auto-generated by Vercel)
CRON_SECRET=
```

- [ ] **Step 3: Commit**

```bash
git add src/types.ts .env.example
git commit -m "chore: add notification types and env example"
```

---

### Task 13: Full Integration Test

**Files:**
- No new files (verification only)

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Run build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: integration fixes for ticket notification system"
```

---

## Manual Testing Checklist

After deployment:

1. **Registration flow:**
   - Open a store with active queue
   - Enter a ticket number with groups ahead > 0
   - Click "通知我 / Notify me"
   - Browser prompts for notification permission
   - Button changes to "通知中 ✓ / Notifying"

2. **Push delivery:**
   - Wait for cron to fire (or trigger manually via Vercel dashboard)
   - Verify notification appears when ticket is within 3 groups
   - Click notification → app opens

3. **Unsubscribe:**
   - Click "通知中 ✓ / Notifying" to cancel
   - Button reverts to "通知我 / Notify me"

4. **Edge cases:**
   - Enter ticket already called → no notification bell shown
   - Close and reopen app → subscription persists via localStorage
   - Change ticket number → prompt to re-register
