# Fare Calculator UX Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Refactor fare calculator UX: remove redundant UI, fix keypad duplication, add sticky bottom bar, improve tier labels, fix desktop input.

**Architecture:** 8 tasks modifying existing components (FareSummary, TierGrid, FareCalculator) and creating one new component (FareBottomBar). SelectedList.tsx deleted.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, lucide-react, motion/react.

## Global Constraints

- Brand color: #aa151b
- Design: neutral-900 dark mode, rounded-2xl cards, font-black headings
- Labels: Traditional Chinese
- Tests: Vitest + @testing-library/react
- Run npm test after each task

---

## File Structure

| File | Action |
|------|--------|
| src/data/menu.ts | Modify — add label? to PriceTier |
| src/components/TierGrid.tsx | Modify — use plate color names |
| src/components/FareSummary.tsx | Modify — remove banner, fix inputMode, clarify labels, fix desktop input |
| src/components/FareBottomBar.tsx | Create — sticky bottom bar |
| src/components/FareCalculator.tsx | Modify — remove SelectedList/empty state, add FareBottomBar |
| src/components/SelectedList.tsx | Delete |
| src/components/FareCalculator.test.tsx | Modify — update assertions |

---

## Tasks

### Task 1: Add label field to PriceTier

**Files:** Modify src/data/menu.ts

- [ ] Step 1: Add optional label to PriceTier interface:

```typescript
export interface PriceTier {
  price: number;
  color: string;
  bgColor: string;
  borderColor: string;
  label?: string;
}
```

- [ ] Step 2: Add labels to main plate tiers:

```typescript
{ price: 12, color: "#FFFFFF", bgColor: "#A70819", borderColor: "#A70819", label: "\u7d0d\u789f" },
{ price: 17, color: "#000000", bgColor: "#C0C0C0", borderColor: "#C0C0C0", label: "\u9ef4\u789f" },
{ price: 22, color: "#000000", bgColor: "#F2E8B5", borderColor: "#F2E8B5", label: "\u91d1\u789f" },
{ price: 27, color: "#FFFFFF", bgColor: "#1E1E1E", borderColor: "#1E1E1E", label: "\u9ed1\u789f" },
```

- [ ] Step 3: Run `npm test` — all 188 tests PASS

- [ ] Step 4: Commit

```bash
git add src/data/menu.ts
git commit -m "feat(fare): add plate color labels"
```

---

### Task 2: Update TierGrid to use plate color names

**Files:** Modify src/components/TierGrid.tsx

- [ ] Step 1: In CounterCard, replace subtitle `<div className="text-[10px] font-bold text-neutral-400 truncate">\u6bcf\u4ef6</div>` with `{tier.label && <div className="text-[10px] font-bold text-neutral-400 truncate">{tier.label}</div>}`

- [ ] Step 2: Run `npm test` — all tests PASS

- [ ] Step 3: Commit

```bash
git add src/components/TierGrid.tsx
git commit -m "feat(fare): show plate color names"
```

---

### Task 3: Fix FareSummary — desktop input, keypad, labels, remove banner

**Files:** Modify src/components/FareSummary.tsx

- [ ] Step 1: Fix `handleNativeChange` to sync `editingValue`:

```typescript
const handleNativeChange = (field: 'target' | 'actual', value: string) => {
  setEditingValue(value || '0');
  const parsed = parseInt(value, 10);
  if (!isNaN(parsed) && parsed > 0 && parsed <= 1000) {
    if (field === 'target') onTargetChange(parsed);
    else onActualChange(parsed);
  }
};
```

- [ ] Step 2: Add `handleBlur` for desktop commit:

```typescript
const handleBlur = () => {
  if (activeField) commit();
};
```

- [ ] Step 3: On both inputs, set `inputMode={activeField ? "none" : "numeric"}`, add `onBlur={handleBlur}`, add `readOnly={!!(isTouch.current && activeField === 'target')}` (or `'actual'`).

- [ ] Step 4: Change remaining label to `\u5c1a\u9918\uff08\u5bf9\u6bd4\u76ee\u6807\uff09` / `\u5df2\u8d85\u51fa\uff08\u5bf9\u6bd4\u76ee\u6807\uff09`

- [ ] Step 5: Delete green status banner (lines 217-226) and remove CheckCircle2 import.

- [ ] Step 6: Run `npm test` — all tests PASS

- [ ] Step 7: Commit

```bash
git add src/components/FareSummary.tsx
git commit -m "fix(fare): fix desktop input, keypad, labels, remove banner"
```

---

### Task 4: Create FareBottomBar component

**Files:** Create src/components/FareBottomBar.tsx

- [ ] Step 1: Create the component:

```tsx
import React from "react";
import { Trash2 } from "lucide-react";

interface FareBottomBarProps {
  totalItems: number;
  total: number;
  onClear: () => void;
}

const formatCurrency = (n: number) => "$" + n.toLocaleString("zh-HK");

export const FareBottomBar: React.FC<FareBottomBarProps> = ({ totalItems, total, onClear }) => {
  if (totalItems === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-[#aa151b] text-white text-xs font-black">{totalItems} \u9805</span>
            <span className="text-lg font-black text-neutral-900 dark:text-white tabular-nums">{formatCurrency(total)}</span>
            <span className="text-[10px] font-bold text-neutral-400 hidden sm:inline">\u542b\u670d\u52d9\u8cbb</span>
          </div>
          <button onClick={onClear} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-neutral-500 hover:text-[#aa151b] hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
            <span>\u6e05\u7a7a</span>
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] Step 2: Run `npm test` — all tests PASS

- [ ] Step 3: Commit

```bash
git add src/components/FareBottomBar.tsx
git commit -m "feat(fare): add FareBottomBar"
```

---

### Task 5: Wire up FareCalculator

**Files:** Modify src/components/FareCalculator.tsx, Delete src/components/SelectedList.tsx

- [ ] Step 1: Update imports — remove SelectedList, add FareBottomBar

- [ ] Step 2: Replace `<SelectedList ... />` with `<FareBottomBar totalItems={totalItems} total={total} onClear={handleClearAll} />`

- [ ] Step 3: Delete empty state card (lines 98-108) and remove Calculator import

- [ ] Step 4: Add `pb-20` to main container div

- [ ] Step 5: Delete SelectedList.tsx

- [ ] Step 6: Run `npm test` — some tests may fail, fix in Task 6

- [ ] Step 7: Commit

```bash
git add -A
git commit -m "feat(fare): replace SelectedList with sticky bar"
```

---

### Task 6: Update tests

**Files:** Modify src/components/FareCalculator.test.tsx

- [ ] Step 1: Replace all `screen.getByText("\u5c1a\u672a\u9078\u64c7\u50f9\u683c\u5c64\u7d1a")` with `screen.queryByText("\u5df2\u9078\u64c7")` (expect null)

- [ ] Step 2: Add bottom bar test:

```typescript
it("shows bottom bar when items are selected", () => {
  render(<FareCalculator />);
  const buttons = screen.getAllByRole("button");
  const plusBtn = buttons.find((btn) => btn.querySelector(".lucide-plus"));
  fireEvent.click(plusBtn!);
  expect(screen.getByText(/\d+ \u9805/)).toBeInTheDocument();
});
```

- [ ] Step 3: Run `npm test` — all tests PASS

- [ ] Step 4: Run `npm run build` — no errors

- [ ] Step 5: Commit

```bash
git add src/components/FareCalculator.test.tsx
git commit -m "test(fare): update tests"
```

---

### Task 7: Final verification

- [ ] Step 1: Run `npm test` — all PASS

- [ ] Step 2: Run `npm run build` — no errors

- [ ] Step 3: Run `npm run dev` — smoke test in browser

- [ ] Step 4: Commit any fixes if needed
