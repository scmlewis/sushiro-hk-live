# Plan: Fix Ticket Calculator — No Queue = "直入"

## Context

When a store has no queues (just opened, or no one waiting), entering any ticket number in the calculator shows fake results like "尚有 132 組 / 約 178 分鐘" because `minCalledNum` falls back to a random number based on `store.id`.

The correct behavior (per reference app): when no queues exist, show "直入" (walk-in) and "約0分".

## Root Cause

`src/components/StoreDetailModal.tsx` line 75:
```tsx
const minCalledNum = allCurrentNums.length > 0 
  ? Math.min(...allCurrentNums) 
  : Math.max(1, (store.id * 10) % 150 + 50);  // ← BUG: random fallback
```

## Fix

### 1. Remove the random fallback for `minCalledNum`

```tsx
const minCalledNum = allCurrentNums.length > 0 ? Math.min(...allCurrentNums) : 0;
```

### 2. Add "no queue" handling in ticket validation logic

After the `!isServicing` check, add a check for `allCurrentNums.length === 0`:

```tsx
if (!isServicing) {
  // ... existing non-servicing logic
} else if (allCurrentNums.length === 0) {
  // Store is open but no queues — any ticket is "直入"
  if (!myTicket || isNaN(myTicketNum) || myTicketNum <= 0) {
    ticketValidationState = 'empty';
    validationMessage = '目前無輪候，請輸入籌號或直入';
  } else {
    ticketValidationState = 'valid';
    groupsAhead = 0;
    estimatedMins = 0;
    validationMessage = '目前無輪候，可直入就餐';
  }
} else if (!myTicket || ...) {
  // ... existing logic
}
```

### 3. Update the display to show "直入" when groupsAhead = 0 and store is open

In the display section, when `ticketValidationState === 'valid'` and `groupsAhead === 0`:
- 輪候進度: Show "直入" instead of "尚有 0 組"
- 預估等候時間: Show "約0分" instead of "約 0 分鐘"

## File to Modify

- `src/components/StoreDetailModal.tsx` — Fix `minCalledNum` fallback + add no-queue handling

## Verification

1. `npm run build` passes
2. `npx vitest run` passes
3. Live: Store with no queues + enter any ticket → shows "直入" and "約0分"
4. Live: Store with queues + enter ticket → shows correct groups ahead and estimated time
