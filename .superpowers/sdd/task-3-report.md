# Task 3 Report: Server-Side Push Helper

## What I Implemented

Created `api/_lib/push.ts` — a server-side Web Push helper module using the `web-push` library.

### Exports

- **`PushSubscription`** interface — `{ endpoint, keys: { p256dh, auth } }`
- **`sendPushNotification(subscription, payload): Promise<void>`** — Sends a push notification with a 5-minute TTL

### Behavior

- VAPID details configured lazily at module load (only when both `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` env vars are present)
- If keys are missing, `sendPushNotification` logs a warning and returns silently (no-op in dev)
- 404/410 HTTP responses throw `'SUBSCRIPTION_EXPIRED'` so callers can prune stale subscriptions
- Other errors are re-thrown after logging

### Fix applied

- Changed `import webPush from 'web-push'` to `import * as webPush from 'web-push'` — the `@types/web-push` package exports named exports, not a default export

## Test Results

- `npx tsc --noEmit api/_lib/push.ts` — **PASS** (zero errors)

## Files Changed

| File | Action |
|------|--------|
| `api/_lib/push.ts` | Created (42 lines) |

## Commits

- `7ac32bc` feat: add server-side push notification helper
