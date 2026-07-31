import React, { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';
import { PriceTier, PRICE_TIERS } from '../data/menu';
import {
  useFareCalculator,
  MAIN_PLATINUM_TIERS,
  OTHER_PLATINUM_TIERS,
} from '../hooks/useFareCalculator';
import { FareSummary } from './FareSummary';
import { TierGrid } from './TierGrid';
import { SelectedList } from './SelectedList';
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
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
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

      <SelectedList
        items={selectedList}
        total={total}
        onIncrement={incrementTier}
        onDecrement={decrementTier}
        onRemove={removeTier}
        onClearAll={handleClearAll}
      />

      <CombinationSuggestions combinations={combinations} />

      {totalItems === 0 && (
        <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl sm:rounded-[1.75rem] p-8 sm:p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto mb-4">
            <Calculator className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-2">尚未選擇價格層級</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            點擊上方的「+」按鈕添加碟子到您的訂單
          </p>
        </div>
      )}
    </div>
  );
};
