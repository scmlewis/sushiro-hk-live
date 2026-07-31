# Task 6 Report: Notify API Route (Cron Handler)

## What Was Implemented

Created `api/notify.ts` — a GET endpoint triggered by Vercel Cron that:
- Verifies cron secret via `Bearer` authorization header (skipped if `CRON_SECRET` is unset)
- Reads `notification:index` to get store IDs with active registrations
- For each store: fetches live queue data via `getQueueData(storeId, true)`, iterates all registrations
- Calculates ticket position and notification tier using `calculateTicketPosition` and `getNotificationTier`
- Sends push notifications when thresholds are hit (position <= 3)
- Prunes expired registrations (4-hour TTL), already-called tickets, and expired subscriptions (404/410 from push)
- Cleans up empty store indices from the global index
- Returns stats: `{ success, checked, notified, pruned, errors }`

Added CORS headers and GET-only method check for consistency with other API routes.

## Test Results

- **TypeScript check (`tsc --noEmit`):** `api/notify.ts` passes with zero errors
- **Pre-existing errors:** 5 errors in `api/_lib/notify-logic.test.ts` (Task 5, not introduced by this task)
- **Lint:** Same pre-existing test errors only; no new issues

## Files Changed

| File | Action |
|------|--------|
| `api/notify.ts` | Created (121 lines) |

## Commit

- `b66163e` — `feat: add GET /api/notify cron handler for push delivery`

## Concerns

None. The implementation follows existing patterns in the codebase (`api/queue.ts`, `api/register.ts`) and correctly integrates all dependencies from Tasks 2, 3, and 5.
