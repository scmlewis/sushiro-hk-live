import { useState, useMemo, useCallback } from 'react';
import { PriceTier, PRICE_TIERS, getTierByPrice } from '../data/menu';

export const SERVICE_CHARGE_RATE = 0.1;
export const MAX_COMBO_LENGTH = 5;
export const COMBO_TOLERANCE = 5;
export const MAIN_PLATINUM_TIERS = [12, 17, 22, 27];
export const OTHER_PLATINUM_TIERS = [10, 13, 18, 19, 22, 27, 28, 33, 38, 39];

const MAIN_TIER_RANK: Record<number, number> = { 12: 0, 17: 1, 22: 2, 27: 3 };
const tierRank = (price: number) => MAIN_TIER_RANK[price] ?? Number.MAX_SAFE_INTEGER;

export interface SelectedEntry {
  tier: PriceTier;
  quantity: number;
  subtotal: number;
}

export interface Combo {
  tiers: PriceTier[];
  total: number;
}

export interface UseFareCalculator {
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
  initialSelectedTiers?: Map<number, number>,
  initialActualBill?: number,
): UseFareCalculator => {
  const [selectedTiers, setSelectedTiers] = useState<Map<number, number>>(
    () => initialSelectedTiers ? new Map(initialSelectedTiers) : new Map(),
  );
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

  const addTier = useCallback((price: number) => {
    setSelectedTiers((prev) => {
      const next = new Map(prev);
      next.set(price, (next.get(price) || 0) + 1);
      return next;
    });
  }, []);

  const removeTier = useCallback((price: number) => {
    setSelectedTiers((prev) => {
      const next = new Map(prev);
      next.delete(price);
      return next;
    });
  }, []);

  const incrementTier = useCallback((price: number) => {
    addTier(price);
  }, [addTier]);

  const decrementTier = useCallback((price: number) => {
    setSelectedTiers((prev) => {
      const next = new Map(prev);
      const current = next.get(price) || 0;
      if (current <= 1) {
        next.delete(price);
      } else {
        next.set(price, current - 1);
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelectedTiers(new Map());
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

  const selectedList = useMemo<SelectedEntry[]>(() => {
    const list: SelectedEntry[] = [];
    selectedTiers.forEach((qty, price) => {
      const tier = allTiersMap.get(price);
      if (tier) {
        list.push({ tier, quantity: qty, subtotal: tier.price * qty });
      }
    });
    return list.sort((a, b) => {
      const rankDiff = tierRank(a.tier.price) - tierRank(b.tier.price);
      if (rankDiff !== 0) return rankDiff;
      return a.tier.price - b.tier.price;
    });
  }, [selectedTiers, allTiersMap]);

  const subtotal = useMemo(() => selectedList.reduce((sum, entry) => sum + entry.subtotal, 0), [selectedList]);
  const serviceCharge = useMemo(() => Math.round(subtotal * SERVICE_CHARGE_RATE), [subtotal]);
  const total = useMemo(() => subtotal + serviceCharge, [subtotal, serviceCharge]);
  const remaining = useMemo(() => targetBudget - total, [targetBudget, total]);
  const totalItems = useMemo(() => selectedList.reduce((sum, e) => sum + e.quantity, 0), [selectedList]);

  const combinations = useMemo<Combo[]>(() => {
    if (remaining <= 0 || allTiersMap.size === 0) return [];
    return findCombinations(Array.from(allTiersMap.values()), remaining, MAX_COMBO_LENGTH, COMBO_TOLERANCE);
  }, [remaining, allTiersMap]);

  return {
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
