# Plan: Support "停飛/現場停止派籌" via localTicketingStatus

## Context

The SUSHI-PASS API returns a `localTicketingStatus` field per store:
- `'ON'` → normal local ticketing
- `'OFF'` → store is NOT issuing new walk-in tickets ("停飛")

Our app currently only reads `netTicketStatus` (always `OFFLINE_MANUAL`) and `storeStatus`. It never reads `localTicketingStatus`, so stores with `localTicketingStatus: 'OFF'` (e.g., 旺角東Moko店, 荃灣廣場店) are incorrectly shown as "派籌中".

## Files to Modify

### 1. `src/types.ts` — Add field to interface
- Add `localTicketingStatus: string` to `SushiroStore` interface (line ~12)

### 2. `src/utils/status.ts` — Update getTicketStatusInfo
- Add `localTicketingStatus` as 3rd parameter with default `'ON'`
- Priority logic (highest first):
  1. `localTicketingStatus === 'OFF'` → label "停止 walk in" (rose-500 badge, matches existing "stop issuing" severity)
  2. `storeStatus !== 'OPEN'` → "休息中 / 閉店" (gray)
  3. `isStoreIssuing(netTicketStatus, storeStatus)` → "派籌中" (amber pulse)
  4. else → "停止線上派籌" (rose)

### 3. `src/components/CompactStoreRow.tsx` — Show "停飛" in wait area
- Pass `store.localTicketingStatus` to status logic
- In the wait time area (line ~72), when `localTicketingStatus === 'OFF'`, show "停飛" text instead of wait number
- This matches the screenshot behavior (status text replaces wait number)

### 4. `src/components/StoreCard.tsx` — Update status badge
- Pass `store.localTicketingStatus` to `getTicketStatusInfo`

### 5. `src/components/StoreDetailModal.tsx` — Update status badge
- Pass `store.localTicketingStatus` to `getTicketStatusInfo`

### 6. `src/components/CompareView.tsx` — Update status badge + wait area
- Pass `store.localTicketingStatus` to `getTicketStatusInfo`
- In the wait time display (line ~129), show "停飛" when `localTicketingStatus === 'OFF'`

### 7. Test files — Add localTicketingStatus to mocks
- `src/App.test.tsx` — Add `localTicketingStatus: 'ON'` to all 3 mock stores
- `src/components/CompactStoreRow.test.tsx` — Add `localTicketingStatus: 'ON'` to mock store
- `src/components/BookmarksSection.test.tsx` — Add `localTicketingStatus: 'ON'` to mock store
- `src/utils/status.test.ts` — Add tests for `localTicketingStatus` in `getTicketStatusInfo`

### 8. New test cases for CompactStoreRow
- Add test: renders "停飛" when `localTicketingStatus === 'OFF'`

## Hard Rules
- Do NOT change `netTicketStatus` logic — keep it as-is for other states
- Real data only; no mock
- Labels are Chinese: use "停飛" for compact display, "停止 walk in" for badge (matches official Sushiro app)

## Verification
1. `npm run build` passes
2. `npx vitest run` passes
3. Live: `curl /api/stores` shows 旺角東Moko店 + 荃灣廣場店 with localTicketingStatus OFF → app displays "停飛"
4. Normal stores (localTicketingStatus ON) still show "派籌中" / wait number
