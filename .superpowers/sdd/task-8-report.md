# Task 8 Report: NotificationBell Component

## What Was Implemented

Created `src/components/NotificationBell.tsx` — a push notification subscription toggle button for the Sushiro HK queue app.

**Props accepted:**
- `storeId: number`
- `ticketNumber: number`
- `groupsAhead: number`
- `onToast: (text, type) => void`

**Behavior:**
- **Idle state:** Shows "通知我 / Notify me" button with Bell icon (red, full-width)
- **Loading state:** Shows Loader2 spinner while registering subscription via `POST /api/register`
- **Subscribed state:** Shows "通知中 ✓ / Notifying" with BellOff icon (outline style), clicking cancels subscription
- **Hidden when:** `groupsAhead <= 0` or browser doesn't support push notifications
- Checks localStorage for existing registration (matching storeId + ticketNumber) on mount

## Test Results

- TypeScript check: **No errors in NotificationBell.tsx**
- Pre-existing errors in `api/_lib/notify-logic.test.ts` (missing queue properties) and `src/utils/push.test.ts` (unused ts-expect-error) are unrelated to this task
- No dedicated unit tests for the component (task spec only required creation + commit)

## Files Changed

| File | Action |
|------|--------|
| `src/components/NotificationBell.tsx` | **Created** (120 lines) |

## Commit

- **SHA:** `fb2db62`
- **Subject:** `feat: add NotificationBell component for push subscription UI`

## Concerns

None — component follows existing patterns and integrates cleanly with `src/utils/push.ts` helpers from Task 7.
