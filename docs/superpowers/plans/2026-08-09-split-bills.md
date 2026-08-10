# Split Bills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-person split bill support to the fare calculator — each person tracks independent plate counts, totals are combined for the table, and a button copies a ready-to-paste split message.

**Architecture:** `useFareCalculator` is refactored from a single flat `selectedTiers: Map<number, number>` to `people: Map<string, Person>` + `activePersonId` held in one `useState`. All tier ops target the active person. Combined totals are derived by **summing per-person values** (never re-rounding the combined subtotal) so copy-message arithmetic is always correct. A new `PersonTabs` component renders the tab bar; `FareBottomBar` gains a 複製分帳 CTA; `FareCalculator` handles localStorage migration and the clipboard write.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, lucide-react icons, Vitest + @testing-library/react (jsdom). No new dependencies.

## Global Constraints

- Combined totals: `subtotal` = Σ person.subtotal, `serviceCharge` = Σ person.serviceCharge, `total` = Σ person.personTotal, `totalItems` = Σ person.totalItems. **Never** compute combined `total` as `round(combinedSubtotal × 0.1)` — this invariant is what makes the split message sum correctly.
- Person ids come from `createPersonId()` (exported helper: `crypto.randomUUID()` with a timestamp fallback). App code never hardcodes ids; tests may.
- All tier operations (`addTier`, `incrementTier`, `decrementTier`, `removeTier`, `clearAll`) mutate only the active person. No disabled/read-only tier mode exists.
- Single-person behavior is byte-identical to the current calculator: `PersonTabs` returns `null` when `people.size <= 1`.
- Follow existing patterns: `Card`, `TierBadge`, `formatCurrency` (from `src/utils/formatCurrency.ts`), brand color `bg-[#aa151b]`, `active:scale-95`, lucide-react icons.
- Commands: `npm run lint` (`tsc --noEmit`), `npm test` (`vitest run`), `npm run build`.
- `docs/superpowers/` is in `.gitignore` — commit plan/spec files with `git add -f`.
- Copy strings (exact): toast `'已複製到剪貼簿'`; buttons `新增`, `編輯`, `複製分帳`; default names `你` (first person) and `成員 N` (added people).

---

### Task 1: Multi-person data layer in `useFareCalculator` + persistence migration

Refactor the hook to `people`/`activePersonId` state, update `FareCalculator` persistence to the new shape (with old-shape migration), and add hook unit tests. After this task the app compiles and all existing tests still pass (single person behaves identically).

**Files:**
- Modify: `src/hooks/useFareCalculator.ts`
- Modify: `src/components/FareCalculator.tsx`
- Test: `src/hooks/useFareCalculator.test.ts` (new)

**Interfaces:**
- Consumes: existing `PriceTier`, `PRICE_TIERS`, `getTierByPrice` from `../data/menu`.
- Produces:
  - `export interface Person { name: string; selectedTiers: Map<number, number>; }`
  - `export const createPersonId = (): string`
  - `export interface UseFareCalculator` — adds `people`, `activePersonId`, `personTotals` and person ops; keeps `selectedTiers` as **the active person's** map (for TierGrid).
  - `useFareCalculator(customTiers, initialBudget, initialPeople?: Map<string, Person>, initialActivePersonId?: string, initialActualBill?: number): UseFareCalculator`
  - `FareCalculator` new `PersistedState`: `{ people: [string, { name: string; selectedTiers: [number, number][] }][]; activePersonId: string; targetBudget: number; actualBill: number; customTiers: PriceTier[]; }`

- [ ] **Step 1: Write the failing hook tests**

Create `src/hooks/useFareCalculator.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFareCalculator, Person } from './useFareCalculator';

const person = (name: string, tiers: [number, number][] = []): Person => ({
  name,
  selectedTiers: new Map(tiers),
});

describe('useFareCalculator', () => {
  it('starts with a single default person named 你 and zero totals', () => {
    const { result } = renderHook(() => useFareCalculator());
    expect(result.current.people.size).toBe(1);
    expect(result.current.activePersonId).toBe(result.current.people.keys().next().value);
    expect(result.current.people.get(result.current.activePersonId)!.name).toBe('你');
    expect(result.current.subtotal).toBe(0);
    expect(result.current.serviceCharge).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it('addTier targets the active person only', () => {
    const { result } = renderHook(() => useFareCalculator());
    const firstId = result.current.activePersonId;
    act(() => result.current.addPerson('Alice'));
    act(() => result.current.addTier(12));
    expect(result.current.people.get(result.current.activePersonId)!.selectedTiers.get(12)).toBe(1);
    expect(result.current.people.get(firstId)!.selectedTiers.size).toBe(0);
    expect(result.current.totalItems).toBe(1);
    expect(result.current.total).toBe(13);
  });

  it('sums per-person service charges so combined totals stay consistent', () => {
    const people = new Map<string, Person>([
      ['a', person('你', [[12, 1]])],
      ['b', person('Alice', [[13, 1]])],
    ]);
    const { result } = renderHook(() => useFareCalculator([], 80, people, 'a'));
    expect(result.current.subtotal).toBe(25);
    expect(result.current.serviceCharge).toBe(2);
    expect(result.current.total).toBe(27);
  });

  it('switches the active person to the first remaining when the active one is removed', () => {
    const people = new Map<string, Person>([
      ['a', person('你')],
      ['b', person('Alice')],
      ['c', person('Bob')],
    ]);
    const { result } = renderHook(() => useFareCalculator([], 80, people, 'c'));
    act(() => result.current.removePerson('c'));
    expect(result.current.activePersonId).toBe('a');
    expect(result.current.people.size).toBe(2);
  });

  it('does not allow removing the last person', () => {
    const { result } = renderHook(() => useFareCalculator());
    const id = result.current.activePersonId;
    act(() => result.current.removePerson(id));
    expect(result.current.people.size).toBe(1);
  });

  it('renames a person and ignores empty names', () => {
    const { result } = renderHook(() => useFareCalculator());
    const id = result.current.activePersonId;
    act(() => result.current.renamePerson(id, '  Alice  '));
    expect(result.current.people.get(id)!.name).toBe('Alice');
    act(() => result.current.renamePerson(id, '   '));
    expect(result.current.people.get(id)!.name).toBe('Alice');
  });

  it('clearAll clears only the active person', () => {
    const people = new Map<string, Person>([
      ['a', person('你', [[12, 2]])],
      ['b', person('Alice', [[17, 1]])],
    ]);
    const { result } = renderHook(() => useFareCalculator([], 80, people, 'a'));
    act(() => result.current.clearAll());
    expect(result.current.people.get('a')!.selectedTiers.size).toBe(0);
    expect(result.current.people.get('b')!.selectedTiers.size).toBe(1);
  });

  it('exposes per-person totals and restores people from initial state', () => {
    const people = new Map<string, Person>([
      ['a', person('你', [[12, 1]])],
      ['b', person('Alice', [[17, 2]])],
    ]);
    const { result } = renderHook(() => useFareCalculator([], 80, people, 'b'));
    expect(result.current.people.size).toBe(2);
    expect(result.current.activePersonId).toBe('b');
    expect(result.current.personTotals.get('a')).toBe(13);
    expect(result.current.personTotals.get('b')).toBe(37);
    expect(result.current.subtotal).toBe(46);
  });

  it('merges quantities across people in the combined selected list', () => {
    const people = new Map<string, Person>([
      ['a', person('你', [[12, 2]])],
      ['b', person('Alice', [[12, 1]])],
    ]);
    const { result } = renderHook(() => useFareCalculator([], 80, people, 'a'));
    expect(result.current.totalItems).toBe(3);
    const entry = result.current.selectedList.find((e) => e.tier.price === 12)!;
    expect(entry.quantity).toBe(3);
    expect(entry.subtotal).toBe(36);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/hooks/useFareCalculator.test.ts`
Expected: FAIL — `Person` not exported / `result.current.people` undefined.

- [ ] **Step 3: Refactor `useFareCalculator`**

Replace the entire contents of `src/hooks/useFareCalculator.ts` with:

```ts
import { useState, useMemo, useCallback } from 'react';
import { PriceTier, PRICE_TIERS, getTierByPrice } from '../data/menu';

export const SERVICE_CHARGE_RATE = 0.1;
export const MAX_COMBO_LENGTH = 5;
export const COMBO_TOLERANCE = 5;
export const MAIN_PLATINUM_TIERS = [12, 17, 22, 27];
export const OTHER_PLATINUM_TIERS = [10, 13, 18, 19, 22, 27, 28, 33, 38, 39];

const MAIN_TIER_RANK: Record<number, number> = { 12: 0, 17: 1, 22: 2, 27: 3 };
const tierRank = (price: number) => MAIN_TIER_RANK[price] ?? Number.MAX_SAFE_INTEGER;

export const createPersonId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `person-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export interface Person {
  name: string;
  selectedTiers: Map<number, number>;
}

export interface SelectedEntry {
  tier: PriceTier;
  quantity: number;
  subtotal: number;
}

export interface Combo {
  tiers: PriceTier[];
  total: number;
}

interface FareState {
  people: Map<string, Person>;
  activePersonId: string;
}

export interface UseFareCalculator {
  people: Map<string, Person>;
  activePersonId: string;
  setActivePerson: (id: string) => void;
  addPerson: (name: string) => string;
  removePerson: (id: string) => void;
  renamePerson: (id: string, name: string) => void;
  personTotals: Map<string, number>;
  selectedTiers: Map<number, number>;
  addTier: (price: number) => void;
  removeTier: (price: number) => void;
  incrementTier: (price: number) => void;
  decrementTier: (price: number) => void;
  clearAll: () => void;
  targetBudget: number;
  setTargetBudget: (value: number) => void;
  actualBill: number;
  setActualBill: (value: number) => void;
  subtotal: number;
  serviceCharge: number;
  total: number;
  remaining: number;
  selectedList: SelectedEntry[];
  totalItems: number;
  combinations: Combo[];
  customTiers: PriceTier[];
  addCustomTier: (price: number) => PriceTier | null;
}

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const findCombinations = (
  tiers: PriceTier[],
  target: number,
  maxLength: number,
  tolerance: number
): Combo[] => {
  const results: Combo[] = [];
  const sorted = [...tiers].sort((a, b) => a.price - b.price);

  const search = (
    startIdx: number,
    current: PriceTier[],
    currentTotal: number
  ) => {
    if (current.length > 0 && currentTotal >= target - tolerance && currentTotal <= target + tolerance) {
      results.push({ tiers: [...current], total: currentTotal });
    }
    if (current.length >= maxLength) return;
    if (currentTotal > target + tolerance) return;

    for (let i = startIdx; i < sorted.length; i++) {
      const tier = sorted[i];
      current.push(tier);
      search(i, current, currentTotal + tier.price);
      current.pop();
    }
  };

  search(0, [], 0);

  const seen = new Set<string>();
  const unique: Combo[] = [];
  for (const combo of results) {
    const key = combo.tiers.map((t) => t.price).join(',');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(combo);
    }
  }

  unique.sort((a, b) => {
    const diffA = Math.abs(a.total - target);
    const diffB = Math.abs(b.total - target);
    if (diffA !== diffB) return diffA - diffB;
    if (a.tiers.length !== b.tiers.length) return a.tiers.length - b.tiers.length;
    return b.total - a.total;
  });

  return unique.slice(0, 6);
};

export const useFareCalculator = (
  customTiers: PriceTier[] = [],
  initialBudget = 80,
  initialPeople?: Map<string, Person>,
  initialActivePersonId?: string,
  initialActualBill?: number,
): UseFareCalculator => {
  const [state, setState] = useState<FareState>(() => {
    if (initialPeople && initialPeople.size > 0) {
      const people = new Map(initialPeople);
      const activePersonId =
        initialActivePersonId && people.has(initialActivePersonId)
          ? initialActivePersonId
          : people.keys().next().value!;
      return { people, activePersonId };
    }
    const people = new Map<string, Person>();
    people.set(createPersonId(), { name: '你', selectedTiers: new Map() });
    return { people, activePersonId: people.keys().next().value! };
  });
  const { people, activePersonId } = state;
  const [targetBudget, setInternalTarget] = useState<number>(initialBudget);
  const [actualBill, setInternalActual] = useState<number>(
    initialActualBill ?? Math.round(initialBudget * (1 + SERVICE_CHARGE_RATE)),
  );

  const allTiersMap = useMemo(() => {
    const map = new Map<number, PriceTier>();
    PRICE_TIERS.forEach((t) => map.set(t.price, t));
    customTiers.forEach((t) => {
      if (!map.has(t.price)) map.set(t.price, t);
    });
    return map;
  }, [customTiers]);

  const setTargetBudget = useCallback((value: number) => {
    const clamped = clamp(value, 1, 2500);
    setInternalTarget(clamped);
    setInternalActual(Math.round(clamped * (1 + SERVICE_CHARGE_RATE)));
  }, []);

  const setActualBill = useCallback((value: number) => {
    const clamped = clamp(value, 1, 2750);
    setInternalActual(clamped);
    setInternalTarget(Math.round(clamped / (1 + SERVICE_CHARGE_RATE)));
  }, []);

  const updateActiveTiers = useCallback(
    (updater: (tiers: Map<number, number>) => Map<number, number>) => {
      setState((prev) => {
        const person = prev.people.get(prev.activePersonId);
        if (!person) return prev;
        const people = new Map(prev.people);
        people.set(prev.activePersonId, {
          ...person,
          selectedTiers: updater(new Map(person.selectedTiers)),
        });
        return { ...prev, people };
      });
    },
    [],
  );

  const addTier = useCallback((price: number) => {
    updateActiveTiers((tiers) => {
      tiers.set(price, (tiers.get(price) || 0) + 1);
      return tiers;
    });
  }, [updateActiveTiers]);

  const removeTier = useCallback((price: number) => {
    updateActiveTiers((tiers) => {
      tiers.delete(price);
      return tiers;
    });
  }, [updateActiveTiers]);

  const incrementTier = useCallback((price: number) => {
    addTier(price);
  }, [addTier]);

  const decrementTier = useCallback((price: number) => {
    updateActiveTiers((tiers) => {
      const current = tiers.get(price) || 0;
      if (current <= 1) {
        tiers.delete(price);
      } else {
        tiers.set(price, current - 1);
      }
      return tiers;
    });
  }, [updateActiveTiers]);

  const clearAll = useCallback(() => {
    updateActiveTiers(() => new Map());
  }, [updateActiveTiers]);

  const addPerson = useCallback((name: string): string => {
    const id = createPersonId();
    setState((prev) => {
      const people = new Map(prev.people);
      people.set(id, { name, selectedTiers: new Map() });
      return { people, activePersonId: id };
    });
    return id;
  }, []);

  const removePerson = useCallback((id: string) => {
    setState((prev) => {
      if (prev.people.size <= 1) return prev;
      const people = new Map(prev.people);
      people.delete(id);
      const activePersonId =
        prev.activePersonId === id ? people.keys().next().value! : prev.activePersonId;
      return { people, activePersonId };
    });
  }, []);

  const renamePerson = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (trimmed === '') return;
    setState((prev) => {
      const person = prev.people.get(id);
      if (!person) return prev;
      const people = new Map(prev.people);
      people.set(id, { ...person, name: trimmed });
      return { ...prev, people };
    });
  }, []);

  const setActivePerson = useCallback((id: string) => {
    setState((prev) => (prev.people.has(id) ? { ...prev, activePersonId: id } : prev));
  }, []);

  const addCustomTier = useCallback((price: number): PriceTier | null => {
    const existing = getTierByPrice(price) || customTiers.find((t) => t.price === price);
    if (existing) return null;
    const newTier: PriceTier = {
      price,
      color: '#000000',
      bgColor: '#E5E7EB',
      borderColor: '#D1D5DB',
    };
    return newTier;
  }, [customTiers]);

  const personBreakdowns = useMemo(() => {
    const map = new Map<
      string,
      { subtotal: number; serviceCharge: number; total: number; totalItems: number }
    >();
    people.forEach((person, id) => {
      let subtotal = 0;
      let totalItems = 0;
      person.selectedTiers.forEach((qty, price) => {
        subtotal += price * qty;
        totalItems += qty;
      });
      const serviceCharge = Math.round(subtotal * SERVICE_CHARGE_RATE);
      map.set(id, { subtotal, serviceCharge, total: subtotal + serviceCharge, totalItems });
    });
    return map;
  }, [people]);

  const personTotals = useMemo(() => {
    const map = new Map<string, number>();
    personBreakdowns.forEach((b, id) => map.set(id, b.total));
    return map;
  }, [personBreakdowns]);

  const subtotal = useMemo(() => {
    let sum = 0;
    personBreakdowns.forEach((b) => { sum += b.subtotal; });
    return sum;
  }, [personBreakdowns]);

  const serviceCharge = useMemo(() => {
    let sum = 0;
    personBreakdowns.forEach((b) => { sum += b.serviceCharge; });
    return sum;
  }, [personBreakdowns]);

  const total = useMemo(() => {
    let sum = 0;
    personBreakdowns.forEach((b) => { sum += b.total; });
    return sum;
  }, [personBreakdowns]);

  const totalItems = useMemo(() => {
    let sum = 0;
    personBreakdowns.forEach((b) => { sum += b.totalItems; });
    return sum;
  }, [personBreakdowns]);

  const selectedTiers = useMemo(
    () => people.get(activePersonId)?.selectedTiers ?? new Map<number, number>(),
    [people, activePersonId],
  );

  const selectedList = useMemo<SelectedEntry[]>(() => {
    const combined = new Map<number, number>();
    people.forEach((person) => {
      person.selectedTiers.forEach((qty, price) => {
        combined.set(price, (combined.get(price) || 0) + qty);
      });
    });
    const list: SelectedEntry[] = [];
    combined.forEach((qty, price) => {
      const tier = allTiersMap.get(price);
      if (tier) list.push({ tier, quantity: qty, subtotal: tier.price * qty });
    });
    return list.sort((a, b) => {
      const rankDiff = tierRank(a.tier.price) - tierRank(b.tier.price);
      if (rankDiff !== 0) return rankDiff;
      return a.tier.price - b.tier.price;
    });
  }, [people, allTiersMap]);

  const remaining = useMemo(() => targetBudget - total, [targetBudget, total]);

  const combinations = useMemo<Combo[]>(() => {
    if (remaining <= 0 || allTiersMap.size === 0) return [];
    return findCombinations(
      Array.from(allTiersMap.values()),
      remaining,
      MAX_COMBO_LENGTH,
      COMBO_TOLERANCE,
    );
  }, [remaining, allTiersMap]);

  return {
    people,
    activePersonId,
    setActivePerson,
    addPerson,
    removePerson,
    renamePerson,
    personTotals,
    selectedTiers,
    addTier,
    removeTier,
    incrementTier,
    decrementTier,
    clearAll,
    targetBudget,
    setTargetBudget,
    actualBill,
    setActualBill,
    subtotal,
    serviceCharge,
    total,
    remaining,
    selectedList,
    totalItems,
    combinations,
    customTiers,
    addCustomTier,
  };
};
```

- [ ] **Step 4: Update `FareCalculator` persistence to the new shape**

Replace the top-of-file imports in `src/components/FareCalculator.tsx`:

```tsx
import React, { useState, useMemo, useEffect } from 'react';
import { PriceTier, PRICE_TIERS } from '../data/menu';
import {
  useFareCalculator,
  createPersonId,
  Person,
  MAIN_PLATINUM_TIERS,
  OTHER_PLATINUM_TIERS,
} from '../hooks/useFareCalculator';
```

Replace the persistence section (storage key, `PersistedState`, `loadState`, `saveState`):

```tsx
const STORAGE_KEY = 'sushiro-fare-calc';

interface PersistedState {
  people: [string, { name: string; selectedTiers: [number, number][] }][];
  activePersonId: string;
  targetBudget: number;
  actualBill: number;
  customTiers: PriceTier[];
}

function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.people)) return parsed as PersistedState;
    if (parsed && Array.isArray(parsed.selectedTiers)) {
      const id = createPersonId();
      const budget = parsed.targetBudget ?? 80;
      return {
        people: [[id, { name: '你', selectedTiers: parsed.selectedTiers }]],
        activePersonId: id,
        targetBudget: budget,
        actualBill: parsed.actualBill ?? Math.round(budget * 1.1),
        customTiers: parsed.customTiers ?? [],
      };
    }
  } catch { /* corrupted data — ignore */ }
  return null;
}

function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* storage full or unavailable */ }
}
```

Replace the hook destructure + call (currently lines ~51-75):

```tsx
  const initialPeople = useMemo(() => {
    if (!saved) return undefined;
    const map = new Map<string, Person>();
    saved.people.forEach(([id, p]) =>
      map.set(id, { name: p.name, selectedTiers: new Map(p.selectedTiers) }),
    );
    return map;
  }, [saved]);

  const {
    people,
    activePersonId,
    setActivePerson,
    addPerson,
    removePerson,
    renamePerson,
    personTotals,
    selectedTiers,
    addTier,
    removeTier,
    incrementTier,
    decrementTier,
    clearAll,
    targetBudget,
    setTargetBudget,
    actualBill,
    setActualBill,
    subtotal,
    serviceCharge,
    total,
    remaining,
    selectedList,
    totalItems,
    combinations,
    addCustomTier,
  } = useFareCalculator(
    customTiersState,
    saved?.targetBudget ?? DEFAULT_BUDGET,
    initialPeople,
    saved?.activePersonId,
    saved?.actualBill,
  );
```

Replace the `saveState` effect (currently lines ~77-84):

```tsx
  useEffect(() => {
    saveState({
      people: Array.from(people.entries()).map(([id, p]) => [
        id,
        { name: p.name, selectedTiers: Array.from(p.selectedTiers.entries()) },
      ]),
      activePersonId,
      targetBudget,
      actualBill,
      customTiers: customTiersState,
    });
  }, [people, activePersonId, targetBudget, actualBill, customTiersState]);
```

The `handleRemoveCustom` handler needs no change — `removeTier(price)` already targets the active person. Leave the JSX untouched in this task.

- [ ] **Step 5: Run tests + lint**

Run: `npx vitest run src/hooks/useFareCalculator.test.ts`
Expected: PASS (all 9 tests).

Run: `npm run lint`
Expected: no errors.

Run: `npm test`
Expected: all existing tests PASS (single-person behavior unchanged).

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useFareCalculator.ts src/components/FareCalculator.tsx src/hooks/useFareCalculator.test.ts
git commit -m "feat(fare): multi-person state in useFareCalculator with localStorage migration"
```

---

### Task 2: `splitMessage` util

Pure function that builds the copy message. The grand total is derived from the passed lines so the message always sums exactly.

**Files:**
- Create: `src/utils/splitMessage.ts`
- Test: `src/utils/splitMessage.test.ts` (new)

**Interfaces:**
- Consumes: `formatCurrency` from `./formatCurrency` (`(n: number) => string`).
- Produces:
  - `export interface SplitLine { name: string; total: number; }`
  - `export const buildSplitMessage = (lines: SplitLine[]): string`
  - Message format: `🍣 壽司郎分帳\n{name}: $total\n...\n總額 (含服務費): $grandTotal` where `grandTotal` = Σ of all `total` values.

- [ ] **Step 1: Write the failing tests**

Create `src/utils/splitMessage.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildSplitMessage } from './splitMessage';

describe('buildSplitMessage', () => {
  it('formats a split message with per-person totals and a summed grand total', () => {
    const message = buildSplitMessage([
      { name: '你', total: 132 },
      { name: 'Alice', total: 85 },
    ]);
    expect(message).toBe('🍣 壽司郎分帳\n你: $132\nAlice: $85\n總額 (含服務費): $217');
  });

  it('grand total always equals the sum of per-person totals', () => {
    const message = buildSplitMessage([
      { name: '你', total: 13 },
      { name: 'Alice', total: 14 },
    ]);
    expect(message).toContain('總額 (含服務費): $27');
  });

  it('includes a person with zero plates as $0', () => {
    const message = buildSplitMessage([
      { name: '你', total: 13 },
      { name: 'Bob', total: 0 },
    ]);
    expect(message).toContain('Bob: $0');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/splitMessage.test.ts`
Expected: FAIL — cannot find module `./splitMessage`.

- [ ] **Step 3: Implement the util**

Create `src/utils/splitMessage.ts`:

```ts
import { formatCurrency } from './formatCurrency';

export interface SplitLine {
  name: string;
  total: number;
}

export const buildSplitMessage = (lines: SplitLine[]): string => {
  const header = '🍣 壽司郎分帳';
  const body = lines.map((l) => `${l.name}: ${formatCurrency(l.total)}`);
  const grandTotal = lines.reduce((sum, l) => sum + l.total, 0);
  const footer = `總額 (含服務費): ${formatCurrency(grandTotal)}`;
  return [header, ...body, footer].join('\n');
};
```

- [ ] **Step 4: Run tests + lint**

Run: `npx vitest run src/utils/splitMessage.test.ts`
Expected: PASS (3 tests).

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/utils/splitMessage.ts src/utils/splitMessage.test.ts
git commit -m "feat(fare): split message formatter util"
```

---

### Task 3: `PersonTabs` component

New tab bar rendered between `FareSummary` and `TierGrid`. Hidden entirely when there is only one person.

**Files:**
- Create: `src/components/PersonTabs.tsx`
- Modify: `src/components/FareCalculator.tsx` (render it)
- Test: `src/components/PersonTabs.test.tsx` (new)

**Interfaces:**
- Consumes:
  - `Person` type from `../hooks/useFareCalculator`
  - `formatCurrency` from `../utils/formatCurrency`
  - lucide-react icons `UserPlus`, `Pencil`, `Trash2`, `Check`, `X`
  - Props:
    ```ts
    interface PersonTabsProps {
      people: Map<string, Person>;
      activePersonId: string;
      personTotals: Map<string, number>;
      onSelect: (id: string) => void;
      onAdd: (name: string) => void;
      onRemove: (id: string) => void;
      onRename: (id: string, name: string) => void;
    }
    ```
- Produces: a rendered component; `FareCalculator` passes `people`, `activePersonId`, `personTotals`, `setActivePerson`, `addPerson`, `removePerson`, `renamePerson`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/PersonTabs.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PersonTabs } from './PersonTabs';
import { Person } from '../hooks/useFareCalculator';

const person = (name: string, tiers: [number, number][] = []): Person => ({
  name,
  selectedTiers: new Map(tiers),
});

const makePeople = () =>
  new Map<string, Person>([
    ['a', person('你', [[12, 1]])],
    ['b', person('Alice', [[17, 1]])],
  ]);

type Overrides = Partial<{
  people: Map<string, Person>;
  activePersonId: string;
  personTotals: Map<string, number>;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
}>;

const renderTabs = (overrides: Overrides = {}) =>
  render(
    <PersonTabs
      people={makePeople()}
      activePersonId="a"
      personTotals={new Map([['a', 13], ['b', 19]])}
      onSelect={vi.fn()}
      onAdd={vi.fn()}
      onRemove={vi.fn()}
      onRename={vi.fn()}
      {...overrides}
    />,
  );

describe('PersonTabs', () => {
  it('renders nothing with a single person', () => {
    const { container } = render(
      <PersonTabs
        people={new Map<string, Person>([['a', person('你')]])}
        activePersonId="a"
        personTotals={new Map([['a', 0]])}
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onRename={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows each person name and their total', () => {
    renderTabs();
    expect(screen.getByText('你')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getAllByText('$13').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('$19').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onSelect when tapping a person tab', () => {
    const onSelect = vi.fn();
    renderTabs({ onSelect });
    fireEvent.click(screen.getByRole('button', { name: /Alice/ }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('adds a member with an incrementing default name', () => {
    const onAdd = vi.fn();
    renderTabs({ onAdd });
    fireEvent.click(screen.getByRole('button', { name: '新增成員' }));
    expect(onAdd).toHaveBeenCalledWith('成員 3');
  });

  it('renames a person via edit mode', () => {
    const onRename = vi.fn();
    renderTabs({ onRename });
    fireEvent.click(screen.getByRole('button', { name: '編輯' }));
    fireEvent.click(screen.getByRole('button', { name: '重新命名 Alice' }));
    const input = screen.getByLabelText('成員名稱');
    fireEvent.change(input, { target: { value: 'Bob' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRename).toHaveBeenCalledWith('b', 'Bob');
  });

  it('removes a person after a two-step confirm', () => {
    const onRemove = vi.fn();
    renderTabs({ onRemove });
    fireEvent.click(screen.getByRole('button', { name: '編輯' }));
    fireEvent.click(screen.getByRole('button', { name: '刪除 Alice' }));
    fireEvent.click(screen.getByRole('button', { name: '確認刪除 Alice' }));
    expect(onRemove).toHaveBeenCalledWith('b');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/PersonTabs.test.tsx`
Expected: FAIL — cannot find module `./PersonTabs`.

- [ ] **Step 3: Implement the component**

Create `src/components/PersonTabs.tsx`:

```tsx
import React, { useRef, useState } from 'react';
import { UserPlus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Person } from '../hooks/useFareCalculator';
import { formatCurrency } from '../utils/formatCurrency';

interface PersonTabsProps {
  people: Map<string, Person>;
  activePersonId: string;
  personTotals: Map<string, number>;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export const PersonTabs: React.FC<PersonTabsProps> = ({
  people,
  activePersonId,
  personTotals,
  onSelect,
  onAdd,
  onRemove,
  onRename,
}) => {
  const [editing, setEditing] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(null);
  const memberCounter = useRef(people.size + 1);

  if (people.size <= 1) return null;

  const handleAdd = () => {
    onAdd(`成員 ${memberCounter.current}`);
    memberCounter.current += 1;
  };

  const startRename = (id: string, name: string) => {
    setRenamingId(id);
    setRenameValue(name);
  };

  const commitRename = (id: string) => {
    onRename(id, renameValue);
    setRenamingId(null);
  };

  const handleRemove = (id: string) => {
    if (confirmingRemoveId === id) {
      onRemove(id);
      setConfirmingRemoveId(null);
    } else {
      setConfirmingRemoveId(id);
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {Array.from(people.entries()).map(([id, person]) => {
        const isActive = id === activePersonId;

        if (renamingId === id) {
          return (
            <div key={id} className="shrink-0">
              <div className="flex items-center gap-1 rounded-xl border-2 border-[#aa151b] bg-white dark:bg-neutral-900 px-2 py-1.5">
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(id);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  aria-label="成員名稱"
                  autoFocus
                  className="w-20 bg-transparent text-sm font-black text-neutral-900 dark:text-white outline-none"
                />
                <button
                  onClick={() => commitRename(id)}
                  aria-label="確認改名"
                  className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRenamingId(null)}
                  aria-label="取消改名"
                  className="p-1 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        }

        return (
          <div key={id} className="shrink-0">
            <div
              className={`flex items-center rounded-xl border-2 transition-all ${
                isActive
                  ? 'bg-[#aa151b] border-[#aa151b]'
                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <button
                onClick={() => onSelect(id)}
                aria-pressed={isActive}
                className={`flex items-center gap-2 px-3 py-2 ${
                  isActive ? 'text-white' : 'text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <span className="text-sm font-black whitespace-nowrap">{person.name}</span>
                <span
                  className={`text-[10px] font-bold tabular-nums ${
                    isActive ? 'text-white/80' : 'text-neutral-400'
                  }`}
                >
                  {formatCurrency(personTotals.get(id) ?? 0)}
                </span>
              </button>
              {editing && (
                <span className="flex items-center gap-0.5 pr-1.5">
                  <button
                    onClick={() => startRename(id, person.name)}
                    aria-label={`重新命名 ${person.name}`}
                    className={`p-1.5 rounded-lg transition-all ${
                      isActive
                        ? 'text-white/80 hover:bg-white/20'
                        : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemove(id)}
                    aria-label={
                      confirmingRemoveId === id
                        ? `確認刪除 ${person.name}`
                        : `刪除 ${person.name}`
                    }
                    className={`flex items-center gap-1 p-1.5 rounded-lg transition-all ${
                      isActive
                        ? 'text-white/80 hover:bg-white/20'
                        : 'text-neutral-400 hover:bg-red-50 dark:hover:bg-red-950/20'
                    }`}
                  >
                    {confirmingRemoveId === id ? (
                      <span className="text-[10px] font-black text-red-500">確認?</span>
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </span>
              )}
            </div>
          </div>
        );
      })}

      <button
        onClick={handleAdd}
        aria-label="新增成員"
        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 text-sm font-black transition-all hover:border-[#aa151b] hover:text-[#aa151b] active:scale-95"
      >
        <UserPlus className="w-4 h-4" />
        <span>新增</span>
      </button>

      <button
        onClick={() => setEditing((v) => !v)}
        aria-pressed={editing}
        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 text-sm font-black transition-all hover:border-[#aa151b] hover:text-[#aa151b] active:scale-95"
      >
        <Pencil className="w-4 h-4" />
        <span>編輯</span>
      </button>
    </div>
  );
};
```

Note: the default added name is `成員 ${people.size + 1}` — with 2 people present this is `成員 3`, matching the test.

- [ ] **Step 4: Render `PersonTabs` in `FareCalculator`**

In `src/components/FareCalculator.tsx`, add the import:

```tsx
import { PersonTabs } from './PersonTabs';
```

Insert between the `FareSummary` element and the `TierGrid` element:

```tsx
      <PersonTabs
        people={people}
        activePersonId={activePersonId}
        personTotals={personTotals}
        onSelect={setActivePerson}
        onAdd={addPerson}
        onRemove={removePerson}
        onRename={renamePerson}
      />
```

- [ ] **Step 5: Run tests + lint**

Run: `npx vitest run src/components/PersonTabs.test.tsx`
Expected: PASS (5 tests).

Run: `npm run lint`
Expected: no errors.

Run: `npm test`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/PersonTabs.tsx src/components/PersonTabs.test.tsx src/components/FareCalculator.tsx
git commit -m "feat(fare): person tabs for split bill editing"
```

---

### Task 4: 複製分帳 CTA in `FareBottomBar` + clipboard wiring

Show a `複製分帳` button when 2+ people exist. Tapping it builds the message, writes it to the clipboard (with `execCommand` fallback), and fires a toast.

**Files:**
- Modify: `src/components/FareBottomBar.tsx`
- Modify: `src/components/FareCalculator.tsx`
- Test: `src/components/FareCalculator.test.tsx` (append tests)

**Interfaces:**
- Consumes: `buildSplitMessage`, `SplitLine` from `../utils/splitMessage`; lucide `ClipboardCopy` icon; `Person` type from `../hooks/useFareCalculator`.
- Produces:
  - `FareBottomBarProps` gains: `peopleCount: number;` and `onCopySplit?: () => void;`
  - `FareCalculator` implements `handleCopySplit` and passes `peopleCount={people.size}` and `onCopySplit={handleCopySplit}`.

- [ ] **Step 1: Write the failing integration tests**

In `src/components/FareCalculator.test.tsx`, update the imports at the top:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
```

Append inside the existing `describe('FareCalculator', () => { ... })` block:

```tsx
  it('does not show the split CTA with a single person', () => {
    render(<FareCalculator />);
    expect(screen.queryByRole('button', { name: '複製分帳' })).not.toBeInTheDocument();
  });

  it('copies a split message after adding a second person', async () => {
    const onToast = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    render(<FareCalculator onToast={onToast} />);

    fireEvent.click(screen.getByRole('button', { name: '新增成員' }));
    expect(screen.getByRole('button', { name: '複製分帳' })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: '增加 10 數量' })[0]);
    fireEvent.click(screen.getByRole('button', { name: '複製分帳' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const message = writeText.mock.calls[0][0] as string;
    expect(message).toContain('🍣 壽司郎分帳');
    expect(message).toContain('成員 2: $11');
    expect(message).toContain('總額 (含服務費): $11');
    expect(onToast).toHaveBeenCalledWith('已複製到剪貼簿', 'success');
  });

  it('removes a person via edit mode and hides the split CTA', () => {
    render(<FareCalculator />);
    fireEvent.click(screen.getByRole('button', { name: '新增成員' }));
    fireEvent.click(screen.getByRole('button', { name: '編輯' }));
    fireEvent.click(screen.getByRole('button', { name: '刪除 成員 2' }));
    fireEvent.click(screen.getByRole('button', { name: '確認刪除 成員 2' }));
    expect(screen.queryByText('成員 2')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '複製分帳' })).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/FareCalculator.test.tsx`
Expected: FAIL — `複製分帳` button not found / `peopleCount` prop type error.

- [ ] **Step 3: Add the CTA to `FareBottomBar`**

In `src/components/FareBottomBar.tsx`:

Add `ClipboardCopy` to the lucide import:

```tsx
import { ChevronDown, Trash2, X, ClipboardCopy } from 'lucide-react';
```

Update the props interface and destructure:

```tsx
interface FareBottomBarProps {
  totalItems: number;
  total: number;
  selectedList: SelectedEntry[];
  onClear: () => void;
  peopleCount: number;
  onCopySplit?: () => void;
}
```

```tsx
export const FareBottomBar: React.FC<FareBottomBarProps> = ({
  totalItems,
  total,
  selectedList,
  onClear,
  peopleCount,
  onCopySplit,
}) => {
```

Inside the right-side button cluster (the fragment that currently wraps the `confirming` conditional), render the CTA before the clear/confirm controls:

```tsx
            {peopleCount >= 2 && onCopySplit && (
              <button
                onClick={onCopySplit}
                aria-label="複製分帳"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-black transition-all hover:bg-white/30 active:scale-95"
              >
                <ClipboardCopy className="w-3.5 h-3.5" />
                <span>複製分帳</span>
              </button>
            )}
```

The current structure is `{confirming ? (...) : (...)}` inside a `flex items-center gap-1.5` wrapper — wrap that whole conditional (plus the new button) in a fragment:

```tsx
            <div className="flex items-center gap-1.5">
              {peopleCount >= 2 && onCopySplit && (
                <button
                  onClick={onCopySplit}
                  aria-label="複製分帳"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-black transition-all hover:bg-white/30 active:scale-95"
                >
                  <ClipboardCopy className="w-3.5 h-3.5" />
                  <span>複製分帳</span>
                </button>
              )}
              {confirming ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={cancelConfirm}
                    aria-label="取消清空"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={requestClear}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#aa151b] text-xs font-black transition-all hover:bg-red-50 active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>確認清空?</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={requestClear}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>清空</span>
                </button>
              )}
            </div>
```

- [ ] **Step 4: Wire the copy handler in `FareCalculator`**

In `src/components/FareCalculator.tsx`:

Add imports:

```tsx
import { PersonTabs } from './PersonTabs';
import { buildSplitMessage } from '../utils/splitMessage';
```

Add `useCallback` to the React import:

```tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
```

Add the handler after `handleClearAll`:

```tsx
  const handleCopySplit = useCallback(async () => {
    const lines = Array.from(people.entries()).map(([id, p]) => ({
      name: p.name,
      total: personTotals.get(id) ?? 0,
    }));
    const message = buildSplitMessage(lines);
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = message;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    onToast?.('已複製到剪貼簿', 'success');
  }, [people, personTotals, onToast]);
```

Update the `<FareBottomBar ... />` call to pass the new props:

```tsx
      <FareBottomBar
        totalItems={totalItems}
        total={total}
        selectedList={selectedList}
        onClear={handleClearAll}
        peopleCount={people.size}
        onCopySplit={handleCopySplit}
      />
```

- [ ] **Step 5: Run tests + lint + build**

Run: `npx vitest run src/components/FareCalculator.test.tsx`
Expected: PASS (all tests, including the 3 new ones).

Run: `npm run lint`
Expected: no errors.

Run: `npm test`
Expected: all PASS.

Run: `npm run build`
Expected: succeeds (chunk-size warning is pre-existing and acceptable).

- [ ] **Step 6: Commit**

```bash
git add src/components/FareBottomBar.tsx src/components/FareCalculator.tsx src/components/FareCalculator.test.tsx
git commit -m "feat(fare): copy split bill message CTA in bottom bar"
```

---

### Task 5: Persist the plan and finish

- [ ] **Step 1: Commit the plan and spec docs**

```bash
git add -f docs/superpowers/plans/2026-08-09-split-bills.md docs/superpowers/specs/2026-08-09-split-bills-design.md
git commit -m "docs: split bills implementation plan"
```
