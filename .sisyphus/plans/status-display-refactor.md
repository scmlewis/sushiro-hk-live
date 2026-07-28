# Plan: Refactor Status Display + StoreDetailModal Non-Working Hours

## Context

Our app currently shows "0分 0組" for stores that are logically closed, while Sushi Long shows "收工". Status text varies across components ("休息" vs "休息中" vs "非營業時間"). The StoreDetailModal also needs a non-working hours mode with disabled buttons and "收工/等開工" display.

## Part 1: Status Display Rules (revised heuristic)

| Priority | Condition | Wait Area Text | Group Text | Badge |
|----------|-----------|----------------|------------|-------|
| 1 | `storeStatus !== 'OPEN'` | `休息` | `--` | 暫停派籌 |
| 2 | `storeStatus === 'OPEN'` + `netTicketStatus === 'OFFLINE_MANUAL'` + `wait === 0` + `waitingGroup === 0` | `收工` | `--` | 停止線上派籌 |
| 3 | `localTicketingStatus === 'OFF'` | `停飛` | (actual groups) | 停止 walk in |
| 4 | OPEN + normal queue | `X分` | `X組` | 派籌中 |

**Key decisions:**
- Use `OFFLINE_MANUAL + 0/0` as the heuristic for "winding down" (more specific than just 0/0)
- "收工" aligned with Sushi Long's display
- "停飛" for walk-in ticketing stopped
- "休息" for officially closed stores

## Part 2: StoreDetailModal Non-Working Hours Mode

When store is not servicing (closed, 停飛, or 停止線上派籌), the keypad section should:

1. **Disable calling status buttons** — "下一位", "下兩位", "下三位" grayed out
2. **Show "收工" and "等開工" buttons** — instead of the normal ticket calculator
3. **Keep numpad visible** — for users who still want to enter ticket numbers

Reference screenshot shows:
- Calling status section: "—" placeholders for queue types
- Keypad section: numpad on left, "收工" (red outline) and "等開工" (red outline) stacked on right

## Files to Modify

### 1. `src/utils/status.ts` — Add `getStoreDisplayStatus` + clean up

Add new function:
```ts
interface StoreDisplayStatus {
  waitText: string;        // "休息" | "收工" | "停飛" | "X分"
  groupText: string;       // "--" | "X組"
  isClosed: boolean;       // true if store is not servicing
  accentColor: string;     // for the left bar
}

function getStoreDisplayStatus(store: SushiroStore): StoreDisplayStatus
```

Also add helper:
```ts
function isStoreServicing(store: SushiroStore): boolean
// Returns false if store is closed, 停飛, or 停止線上派籌
```

Delete unused `getWaitTimeTier` + `WaitTimeTier` interface.

### 2. `src/components/CompactStoreRow.tsx` — Use `getStoreDisplayStatus`

Replace inline logic (lines 31-51, 53, 72-81) with single `getStoreDisplayStatus(store)` call.

### 3. `src/components/CompareView.tsx` — Use `getStoreDisplayStatus`

Replace inline wait/group logic (lines 129, 138) with `getStoreDisplayStatus`.

### 4. `src/components/StoreCard.tsx` — Use `getStoreDisplayStatus`

Replace wait area logic (lines 152-171) with `getStoreDisplayStatus`. Add "停飛" handling.

### 5. `src/components/StoreDetailModal.tsx` — Non-working hours keypad

When `!isStoreServicing(store)`:

**Calling status section (lines 167-193):**
- Always show the section (remove `allCurrentNums.length > 0` guard)
- Show "—" as placeholder for each queue type (桌席, 吧台, 現場/混合)
- Keep the refresh button

**Keypad section (lines 196-310):**
- Keep numpad on the left side
- Replace right side (輪候進度 + 預估等候時間) with:
  - "收工" button (red outline) — indicates store is done
  - "等開工" button (red outline) — indicates waiting for next service
- Disable numpad input when store is not servicing
- Show appropriate validation message: "門市目前已收工，籌號計算器暫停使用"

### 6. Tests

- `status.test.ts`: Add tests for `getStoreDisplayStatus`, `isStoreServicing`. Remove `getWaitTimeTier` tests.
- `CompactStoreRow.test.tsx`: Update for "收工" display (OFFLINE_MANUAL + 0/0)
- `StoreDetailModal.test.tsx` (new or existing): Add tests for non-working hours keypad

## Files NOT Modified

- `src/types.ts` — No changes needed
- `src/App.tsx` — Uses `isStoreIssuing` for filtering, no display changes

## Verification

1. `npm run build` passes
2. `npx vitest run` passes
3. Live: OPEN + OFFLINE_MANUAL + 0/0 stores show "收工"
4. Live: `localTicketingStatus=OFF` stores show "停飛"
5. Live: closed stores show "休息"
6. Live: normal stores show "X分 X組"
7. Live: StoreDetailModal shows "—" placeholders + "收工/等開工" for non-servicing stores
