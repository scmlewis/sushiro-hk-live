# Task 7 Report: Client-Side Push Helpers (with tests)

## Status: DONE

## TDD Evidence

### RED (Test Failure)
```
FAIL src/utils/push.test.ts [ src/utils/push.test.ts ]
Error: Failed to resolve import "./push" from "src/utils/push.test.ts". Does the file exist?
```
Tests failed because `src/utils/push.ts` did not exist yet — expected behavior.

### GREEN (All Tests Pass)
```
✓ src/utils/push.test.ts (16 tests) 8ms
Test Files  1 passed (1)
     Tests  16 passed (16)
```

## What Was Implemented

### `src/utils/push.ts`
- `isPushSupported()` — checks `navigator.serviceWorker`, `PushManager`, and `Notification` APIs
- `getNotificationPermission()` — returns `Notification.permission` or `'denied'` if API unavailable
- `requestPushSubscription()` — requests permission and subscribes via PushManager with VAPID key
- `serializeSubscription(subscription)` — converts PushSubscription to JSON-safe `{ endpoint, keys: { p256dh, auth } }` format
- `urlBase64ToUint8Array()` — private helper for VAPID key conversion
- `getStoredRegistration(storeId)` — reads registration from localStorage
- `storeRegistration(storeId, registrationId, ticketNumber)` — writes registration to localStorage
- `removeRegistration(storeId)` — removes registration from localStorage

### `src/utils/push.test.ts`
16 tests covering:
- `isPushSupported`: SSR (no navigator), missing serviceWorker, full API support
- `getNotificationPermission`: missing Notification API, active permission
- `serializeSubscription`: endpoint and keys serialization
- `getStoredRegistration`: empty, non-existent, valid, and corrupted storage
- `storeRegistration`: new, multi-store, overwrite
- `removeRegistration`: specific removal, empty storage, non-existent storeId

## Test Results
- **16/16 tests passing**

## Files Changed
| File | Action |
|------|--------|
| `src/utils/push.ts` | Created |
| `src/utils/push.test.ts` | Created |

## Issues
- Initial test for `getNotificationPermission` used `Object.defineProperty` on `window.Notification` which is non-configurable in jsdom. Fixed by using `vi.stubGlobal` instead.
- Commit: `ba0ff79` — `feat: add client-side push subscription helpers with tests`
