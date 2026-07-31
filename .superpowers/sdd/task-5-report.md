# Task 5: Notification Threshold Logic — Report

## TDD Evidence

### RED (tests fail, module not found)
```
FAIL api/_lib/notify-logic.test.ts
Error: Failed to resolve import "./notify-logic" from "api/_lib/notify-logic.test.ts". Does the file exist?
```

### GREEN (all 9 tests pass)
```
✓ api/_lib/notify-logic.test.ts (9 tests) 6ms
Test Files  1 passed (1)
     Tests  9 passed (9)
```

## What Was Implemented

- **`calculateTicketPosition(ticketNumber, queue)`** — Scans all queue arrays (booth, counter, store, mixed, reservation-excluded), finds the max called number, returns `ticketNumber - maxCalled`. Negative means already called.
- **`getNotificationTier(position)`** — Maps position to tier:
  - `<= 0` → `called` (notify)
  - `1` → `almost` (notify)
  - `2-3` → `close` (notify with group count)
  - `> 3` → `none` (no notify)

## Test Results

9 tests, all passing:
- `calculateTicketPosition`: 5 tests (negative, next, ahead, empty, reservation exclusion)
- `getNotificationTier`: 4 tests (called, almost, close 2-3, none)

## Files Changed

| File | Action |
|------|--------|
| `api/_lib/notify-logic.ts` | Created — threshold logic implementation |
| `api/_lib/notify-logic.test.ts` | Created — 9 unit tests |

## Commit

- `7d212e8` — `feat: add notification threshold logic with tests`

## Notes

- Fixed plan's test expectation: `calculateTicketPosition(12, {boothQueue: ['10', '11'], counterQueue: ['10']})` returns 1, not 0 (max called is 11, not 12).
- Fixed plan's `getNotificationTier` tests to include `position` field in `toEqual` assertions.
