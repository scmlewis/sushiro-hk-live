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
