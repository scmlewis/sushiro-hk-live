# UI Polish — 6 Quick Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 6 UI/UX polish issues in the fare calculator and app shell.

**Architecture:** Each fix is a small, self-contained change in one or two files. No new components or hooks needed. All changes are Tailwind class edits, a `useEffect` addition, and a footer deletion.

**Tech Stack:** React 19, Tailwind CSS, Motion (Framer)

---

## Task 1: Custom price cards — fix cramped layout on mobile

**Files:**
- Modify: `src/components/TierGrid.tsx:29-70` (CounterCard)

**Problem:** On mobile `grid-cols-2`, each card is ~170px wide. The controls row `[−][qty][+][🗑]` overflows. The trash button competes for space.

**Fix:** On mobile, make the trash icon smaller and add a vertical separator so the controls don't crush the badge area. Reduce button sizes on mobile.

- [ ] **Step 1: Update CounterCard layout**

In `src/components/TierGrid.tsx`, replace the CounterCard component (lines 21–73) with:

```tsx
const CounterCard: React.FC<{
  tier: PriceTier;
  qty: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove?: () => void;
}> = ({ tier, qty, onIncrement, onDecrement, onRemove }) => {
  return (
    <div className="flex items-center justify-between gap-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3 transition-all hover:border-neutral-300 dark:hover:border-neutral-700">
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <TierBadge tier={tier} />
        {tier.label && (
          <span className="text-xs font-black text-neutral-900 dark:text-white truncate max-w-[60px]">
            {tier.label}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onDecrement}
          disabled={qty === 0}
          aria-label={`減少 ${tier.price} 數量`}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
            qty === 0
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-95'
          }`}
        >
          <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <span className="w-6 sm:w-7 text-center text-sm sm:text-base font-black text-neutral-900 dark:text-white tabular-nums">
          {qty}
        </span>
        <button
          onClick={onIncrement}
          aria-label={`增加 ${tier.price} 數量`}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#aa151b] text-white flex items-center justify-center transition-all hover:bg-red-700 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        {onRemove && (
          <>
            <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-0.5" />
            <button
              onClick={onRemove}
              aria-label={`刪除 $${tier.price} 價格層級`}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-[#aa151b] hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
            >
              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify in browser**

Open the app → 計算 tab → add custom price → confirm the custom tier card renders without overflow. Check both mobile (375px) and desktop.

- [ ] **Step 3: Commit**

```bash
git add src/components/TierGrid.tsx
git commit -m "fix(fare): tighten CounterCard layout, smaller trash icon with separator"
```

---

## Task 2: FareBottomBar — collapse expanded list on outside click

**Files:**
- Modify: `src/components/FareBottomBar.tsx:61-156` (the `bar` JSX)

**Problem:** The expanded item list only collapses when the user clicks the bar toggle again. Clicking anywhere else (e.g. tier cards, background) doesn't dismiss it.

**Fix:** Add a `useEffect` that listens for clicks on `document` and collapses the list if the click target is outside the bar container.

- [ ] **Step 1: Add outside-click effect**

In `src/components/FareBottomBar.tsx`, add a ref and a `useEffect` after the existing refs/effects (after line 27):

```tsx
const barRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!expanded) return;
  const handleClickOutside = (e: MouseEvent) => {
    if (barRef.current && !barRef.current.contains(e.target as Node)) {
      setExpanded(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [expanded]);
```

- [ ] **Step 2: Attach the ref to the outer container**

Change line 62 from:
```tsx
    <div className="fixed bottom-0 left-0 right-0 z-40 px-2 pb-2">
```
to:
```tsx
    <div ref={barRef} className="fixed bottom-0 left-0 right-0 z-40 px-2 pb-2">
```

- [ ] **Step 3: Verify in browser**

Open app → add items → tap the bar to expand the list → tap the tier cards area → list should collapse. Tap to expand → tap the backdrop (not the list) → should also collapse. Tap to expand → tap inside the list → should NOT collapse.

- [ ] **Step 4: Commit**

```bash
git add src/components/FareBottomBar.tsx
git commit -m "fix(fare): collapse expanded list on outside click"
```

---

## Task 3: Keypad input starts empty (not pre-filled)

**Files:**
- Modify: `src/components/TierGrid.tsx:95-98` (`startEditingCustom`)

**Problem:** When the user taps the custom price input on mobile, the keypad opens with the previous value pre-filled (or `0`). The user expects a blank slate to type a fresh number.

**Fix:** Change `startEditingCustom` to set `editingValue` to `''` instead of `customPrice || '0'`.

- [ ] **Step 1: Update startEditingCustom to start empty**

In `src/components/TierGrid.tsx`, change line 97 from:
```tsx
    setEditingValue(customPrice || '0');
```
to:
```tsx
    setEditingValue('');
```

- [ ] **Step 2: Harden the empty-state handlers**

The three handlers below were written for a `'0'`-seeded value. They must now treat `''` (empty) as the starting state so the input reads clean until the user types. In `src/components/TierGrid.tsx`, change:

```tsx
  const handleCustomKeyInput = (digit: string) => {
    setEditingValue((prev) => {
      const next = prev === '0' ? digit : prev + digit;
      return next.length > 4 ? prev : next;
    });
  };

  const handleCustomBackspace = () => {
    setEditingValue((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
  };

  const handleCustomClear = () => setEditingValue('0');
```
to:
```tsx
  const handleCustomKeyInput = (digit: string) => {
    setEditingValue((prev) => {
      const next = prev === '0' || prev === '' ? digit : prev + digit;
      return next.length > 4 ? prev : next;
    });
  };

  const handleCustomBackspace = () => {
    setEditingValue((prev) => (prev.length <= 1 ? '' : prev.slice(0, -1)));
  };

  const handleCustomClear = () => setEditingValue('');
```

- [ ] **Step 3: Verify in browser**

Mobile → tap the custom price input → keypad opens with **empty** display (placeholder visible). Type `8` → shows `8`. Tap ⌫ → back to empty. Type `80` → shows `80`. Tap 完成 → tier added. Tap input again → should start empty again, not show `80`.

- [ ] **Step 4: Commit**

```bash
git add src/components/TierGrid.tsx
git commit -m "fix(fare): keypad input starts empty on open"
```

---

## Task 4: Make keypad 完成 button larger

**Files:**
- Modify: `src/components/NumericKeypad.tsx:34-39` (the 完成 button)

**Problem:** The 完成 (Done) button in the keypad is a small `px-3 py-1 text-xs` pill. On mobile, it's hard to hit with a thumb.

**Fix:** Increase padding, font size, and make it full-width or at least wider.

- [ ] **Step 1: Update the 完成 button**

In `src/components/NumericKeypad.tsx`, replace lines 34–39:
```tsx
          <button
            onClick={onDone}
            className="px-3 py-1 rounded-full bg-[#aa151b] text-white text-xs font-black"
          >
            完成
          </button>
```
with:
```tsx
          <button
            onClick={onDone}
            className="px-5 py-2 rounded-xl bg-[#aa151b] text-white text-sm font-black active:scale-95 transition-transform"
          >
            完成
          </button>
```

- [ ] **Step 2: Verify in browser**

Mobile → tap custom input → keypad opens → 完成 button is visibly larger and easy to tap.

- [ ] **Step 3: Commit**

```bash
git add src/components/NumericKeypad.tsx
git commit -m "fix(fare): enlarge keypad 完成 button for thumb accessibility"
```

---

## Task 5: Toast — add countdown progress bar + keep clear of bottom bar

**Files:**
- Modify: `src/components/Toast.tsx:30` (positioning) and `:29-43` (progress bar)
- Modify: `src/index.css` (add keyframe)

**Problem:** The toast appears at `bottom-4` which overlaps with the fixed FareBottomBar. Also, the user wants a visible countdown indicator so they know when it auto-dismisses.

**Fix:** Two changes:
1. Reposition toast to `bottom-20` on mobile so it clears the bar.
2. Add a progress bar at the toast's bottom edge that animates from 100% → 0% over `TOAST_DURATION_MS` (3200ms). The existing auto-dismiss timer already fires at `TOAST_DURATION_MS`, so the bar finishing == toast disappearing. Use `key={toast.id}` so the animation restarts on each new toast.

- [ ] **Step 1: Add the keyframe to index.css**

Append to `src/index.css`:

```css
@keyframes toast-countdown {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}
```

- [ ] **Step 2: Update Toast.tsx**

Replace the return block (lines 29–43) with:

```tsx
  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50 animate-bounce-short">
      <div className="relative bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-800 dark:border-slate-200 overflow-hidden">
        {iconMap[toast.type || 'info']}
        <span className="text-sm font-medium flex-1">{toast.text}</span>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white dark:hover:text-slate-900 transition-colors p-1"
          aria-label="Close message"
        >
          <X className="w-4 h-4" />
        </button>
        <div
          key={toast.id}
          className="absolute bottom-0 left-0 right-0 h-0.5 origin-left bg-current opacity-40"
          style={{ animation: `toast-countdown ${TOAST_DURATION_MS}ms linear forwards` }}
        />
      </div>
    </div>
  );
```

`bg-current` makes the bar inherit the toast's text color (dark slate on light toast, light on dark toast) so it's visible in both themes.

- [ ] **Step 3: Verify in browser**

Mobile → add items → tap + on a tier → toast appears ABOVE the red total bar with a thin progress line shrinking at its bottom edge. After ~3s the line reaches 0 and the toast dismisses. Trigger a second toast → the bar restarts from 100% (doesn't continue from where the last one ended).

- [ ] **Step 4: Commit**

```bash
git add src/components/Toast.tsx src/index.css
git commit -m "fix: toast countdown progress bar, clear of FareBottomBar"
```

---

## Task 6: Remove footer, move info to About section

**Files:**
- Modify: `src/App.tsx:487-496` (delete footer)
- Modify: `src/components/AboutSection.tsx` (add footer info)

**Problem:** The footer shows data source, disclaimer, and refresh rate — but it's always visible on every page and adds clutter. User wants it in the About section instead.

**Fix:** Delete the `<footer>` block from App.tsx. Add a small "資料來源" section at the bottom of AboutSection.

- [ ] **Step 1: Delete footer from App.tsx**

In `src/App.tsx`, delete lines 487–496 (the entire `<footer>` block):

```tsx
        <footer className="bg-[#141414] text-white px-6 sm:px-8 py-6 border-t-4 border-[#aa151b]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-[11px] font-black tracking-[0.2em] uppercase gap-3 text-neutral-400">
            <div><span>資料來源: </span><span className="text-white">SUSHI-PASS API (HK)</span></div>
            <div><span>免責聲明: </span><span className="text-neutral-300">本網站與壽司郎官方無關</span></div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#aa151b] animate-ping" />
              <span className="text-white">更新頻率: {POLL_INTERVAL_MS / 1000}秒</span>
            </div>
          </div>
        </footer>
```

- [ ] **Step 2: Remove unused POLL_INTERVAL_MS import if no longer needed**

Check if `POLL_INTERVAL_MS` is still used elsewhere in App.tsx. If only the footer used it, remove it from the import on line 4.

- [ ] **Step 3: Add footer info to AboutSection**

In `src/components/AboutSection.tsx`, add a new section before the closing `</div>` (before line 233):

```tsx
      {/* Data Source & Disclaimer */}
      <div className="bg-neutral-100 dark:bg-neutral-800/80 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2">
        <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-500" />
          <span>資料來源與免責聲明</span>
        </h3>
        <div className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5 font-medium">
          <p><strong className="text-neutral-900 dark:text-white">資料來源：</strong>SUSHI-PASS API (HK)</p>
          <p><strong className="text-neutral-900 dark:text-white">更新頻率：</strong>每 10 秒自動刷新</p>
          <p><strong className="text-neutral-900 dark:text-white">免責聲明：</strong>本網站與壽司郎官方無關，資料僅供參考。</p>
        </div>
      </div>
```

Also add `Info` to the lucide-react import on line 2 if not already imported.

- [ ] **Step 4: Verify in browser**

Open app → footer is gone from the bottom of every page. Go to 關於 tab → scroll to bottom → see "資料來源與免責聲明" section with the three lines of info.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/AboutSection.tsx
git commit -m "refactor: remove global footer, move data source info to About section"
```

---

## Verification Checklist

After all 6 tasks, run the full test suite and typecheck:

```bash
npm run lint && npm run build
```

Manually verify on mobile (375px viewport):
1. Custom price cards — no overflow, trash icon is small with separator
2. FareBottomBar expanded list — taps outside collapse it
3. Keypad opens empty — not pre-filled; typing replaces the empty state, ⌫ on empty stays empty
4. 完成 button — large and thumb-friendly
5. Toast — above the red bar, with countdown progress bar that restarts per toast and ends exactly when it dismisses
6. No footer on any page — info is in About section
