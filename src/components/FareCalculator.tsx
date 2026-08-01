import React, { useState, useMemo } from 'react';
import { PriceTier, PRICE_TIERS } from '../data/menu';
import {
  useFareCalculator,
  MAIN_PLATINUM_TIERS,
  OTHER_PLATINUM_TIERS,
} from '../hooks/useFareCalculator';
import { FareSummary } from './FareSummary';
import { TierGrid } from './TierGrid';
import { FareBottomBar } from './FareBottomBar';
import { CombinationSuggestions } from './CombinationSuggestions';

interface FareCalculatorProps {
  onToast?: (text: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const FareCalculator: React.FC<FareCalculatorProps> = ({ onToast }) => {
  const [customTiersState, setCustomTiersState] = useState<PriceTier[]>([]);

  const {
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
  } = useFareCalculator(customTiersState, 80);

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

  const handleClearAll = () => {
    clearAll();
    onToast?.('已清除所有選擇', 'info');
  };

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

      <TierGrid
        allTiers={allTiers}
        mainTierPrices={MAIN_PLATINUM_TIERS}
        otherTierPrices={OTHER_PLATINUM_TIERS}
        quantities={selectedTiers}
        onIncrement={addTier}
        onDecrement={decrementTier}
        onAddCustom={handleAddCustom}
        onToast={onToast}
      />

      <FareBottomBar
        totalItems={totalItems}
        total={total}
        onClear={handleClearAll}
      />

      <CombinationSuggestions combinations={combinations} />
    </div>
  );
};
