import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PriceTier, PRICE_TIERS } from '../data/menu';
import {
  useFareCalculator,
  createPersonId,
  Person,
  MAIN_PLATINUM_TIERS,
  OTHER_PLATINUM_TIERS,
} from '../hooks/useFareCalculator';
import { FareSummary } from './FareSummary';
import { PersonTabs } from './PersonTabs';
import { TierGrid } from './TierGrid';
import { FareBottomBar } from './FareBottomBar';
import { CombinationSuggestions } from './CombinationSuggestions';
import { buildSplitMessage } from '../utils/splitMessage';

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

const DEFAULT_BUDGET = 80;
const DEFAULT_ACTUAL = Math.round(DEFAULT_BUDGET * 1.1);

interface FareCalculatorProps {
  onToast?: (text: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const FareCalculator: React.FC<FareCalculatorProps> = ({ onToast }) => {
  const saved = loadState();
  const [customTiersState, setCustomTiersState] = useState<PriceTier[]>(
    () => saved?.customTiers ?? [],
  );

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

  const allTiers = useMemo(() => {
    const map = new Map<number, PriceTier>();
    PRICE_TIERS.forEach((t) => map.set(t.price, t));
    customTiersState.forEach((t) => {
      if (!map.has(t.price)) map.set(t.price, t);
    });
    return Array.from(map.values()).sort((a, b) => a.price - b.price);
  }, [customTiersState]);

  const handleAddCustom = (price: number) => {
    const added = addCustomTier(price);
    if (added) {
      setCustomTiersState((prev) => [...prev, added]);
    }
  };

  const handleRemoveCustom = (price: number) => {
    setCustomTiersState((prev) => prev.filter((t) => t.price !== price));
    removeTier(price);
    onToast?.(`已刪除 $${price} 價格層級`, 'info');
  };

  const handleClearAll = () => {
    clearAll();
    onToast?.('已清除當前成員的選擇', 'info');
  };

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

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-20">
      <FareSummary
        targetBudget={targetBudget}
        actualBill={actualBill}
        subtotal={subtotal}
        serviceCharge={serviceCharge}
        total={total}
        remaining={remaining}
        onTargetChange={setTargetBudget}
        onActualChange={setActualBill}
      />

      <PersonTabs
        people={people}
        activePersonId={activePersonId}
        personTotals={personTotals}
        onSelect={setActivePerson}
        onAdd={addPerson}
        onRemove={removePerson}
        onRename={renamePerson}
      />

      <TierGrid
        allTiers={allTiers}
        mainTierPrices={MAIN_PLATINUM_TIERS}
        otherTierPrices={OTHER_PLATINUM_TIERS}
        quantities={selectedTiers}
        onIncrement={addTier}
        onDecrement={decrementTier}
        onAddCustom={handleAddCustom}
        onRemoveCustom={handleRemoveCustom}
        onToast={onToast}
      />

      <FareBottomBar
        totalItems={totalItems}
        total={total}
        selectedList={selectedList}
        onClear={handleClearAll}
        peopleCount={people.size}
        onCopySplit={handleCopySplit}
      />

      <CombinationSuggestions combinations={combinations} />
    </div>
  );
};
