import React, { useState, useRef } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { PriceTier } from '../data/menu';
import { TierBadge } from './TierBadge';
import { NumericKeypad } from './NumericKeypad';
import { useIsTouch } from '../hooks/useIsTouch';
import { Card } from './Card';

interface TierGridProps {
  allTiers: PriceTier[];
  mainTierPrices: number[];
  otherTierPrices: number[];
  quantities: Map<number, number>;
  onIncrement: (price: number) => void;
  onDecrement: (price: number) => void;
  onAddCustom: (price: number) => void;
  onRemoveCustom?: (price: number) => void;
  onToast?: (text: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

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

export const TierGrid: React.FC<TierGridProps> = ({
  allTiers,
  mainTierPrices,
  otherTierPrices,
  quantities,
  onIncrement,
  onDecrement,
  onAddCustom,
  onRemoveCustom,
  onToast,
}) => {
  const [customPrice, setCustomPrice] = useState<string>('');
  const [customActive, setCustomActive] = useState(false);
  const [editingValue, setEditingValue] = useState<string>('');
  const isTouch = useIsTouch();

  const allKnownPrices = new Set([...mainTierPrices, ...otherTierPrices]);
  const getTier = (price: number) => allTiers.find((t) => t.price === price);
  const customRenderedTiers = allTiers.filter((t) => !allKnownPrices.has(t.price));

  const startEditingCustom = () => {
    setCustomActive(true);
    setEditingValue('');
  };

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

  const handleCustomNativeChange = (value: string) => {
    setCustomPrice(value);
    setEditingValue(value || '0');
  };

  const handleCustomBlur = () => {
    if (customActive && !isTouch.current) {
      setCustomActive(false);
    }
  };

  const handleAddCustom = (priceArg?: number): boolean => {
    const price = priceArg ?? parseInt(customPrice, 10);
    if (isNaN(price) || price <= 0 || price > 1000) {
      onToast?.('請輸入有效價格 (1-1000)', 'error');
      return false;
    }
    if (getTier(price)) {
      onToast?.('此價格層級已存在', 'warning');
      return false;
    }
    onAddCustom(price);
    setCustomPrice('');
    onToast?.(`已新增 $${price} 價格層級`, 'success');
    return true;
  };

  const handleCustomDone = () => {
    const ok = handleAddCustom(parseInt(editingValue, 10));
    if (ok) {
      setCustomActive(false);
      setCustomPrice('');
      setEditingValue('');
    }
  };

  const cancelCustomEditing = () => {
    setCustomActive(false);
    setEditingValue('');
  };

  return (
    <div className="space-y-6">
      {/* Main plates */}
      <Card>
        <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
          主要碟子
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {mainTierPrices.map((price) => {
            const tier = getTier(price);
            if (!tier) return null;
            return (
              <CounterCard
                key={price}
                tier={tier}
                qty={quantities.get(price) || 0}
                onIncrement={() => onIncrement(price)}
                onDecrement={() => onDecrement(price)}
              />
            );
          })}
        </div>
      </Card>

      {/* Other tiers */}
      <Card>
        <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
          熱食 / 甜品 / 其他
        </h3>

        {/* Mobile horizontal scroll */}
        <div className="sm:hidden flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x">
          {otherTierPrices.map((price) => {
            const tier = getTier(price);
            if (!tier) return null;
            const qty = quantities.get(price) || 0;
            return (
              <div
                key={price}
                className="snap-start shrink-0 w-[140px] bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3"
              >
                <div className="flex items-center justify-center mb-3">
                  <TierBadge tier={tier} size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => onDecrement(price)}
                    disabled={qty === 0}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      qty === 0
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-300'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-base font-black text-neutral-900 dark:text-white tabular-nums">
                    {qty}
                  </span>
                  <button
                    onClick={() => onIncrement(price)}
                    className="w-8 h-8 rounded-full bg-[#aa151b] text-white flex items-center justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop wrapping grid */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-5 gap-3">
          {otherTierPrices.map((price) => {
            const tier = getTier(price);
            if (!tier) return null;
            return (
              <CounterCard
                key={price}
                tier={tier}
                qty={quantities.get(price) || 0}
                onIncrement={() => onIncrement(price)}
                onDecrement={() => onDecrement(price)}
              />
            );
          })}
        </div>
      </Card>

      {/* Custom price */}
      <Card>
        <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
          自訂價格
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-neutral-400">$</span>
            <input
              type="number"
              inputMode={isTouch.current ? 'none' : 'numeric'}
              value={customActive ? editingValue : customPrice}
              onChange={(e) => handleCustomNativeChange(e.target.value)}
              onFocus={startEditingCustom}
              onBlur={handleCustomBlur}
              readOnly={isTouch.current}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCustom();
              }}
              placeholder="自訂 $"
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-black text-neutral-900 dark:text-white outline-none focus:border-[#aa151b] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              min={1}
              max={1000}
            />
          </div>
          <button
            onClick={() => handleAddCustom()}
            aria-label="新增自訂價格"
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#aa151b] text-white text-sm font-black transition-all hover:bg-red-700 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>新增</span>
          </button>
        </div>

        {customRenderedTiers.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {customRenderedTiers.map((tier) => (
              <CounterCard
                key={tier.price}
                tier={tier}
                qty={quantities.get(tier.price) || 0}
                onIncrement={() => onIncrement(tier.price)}
                onDecrement={() => onDecrement(tier.price)}
                onRemove={onRemoveCustom ? () => onRemoveCustom(tier.price) : undefined}
              />
            ))}
          </div>
        )}
      </Card>

      {customActive && isTouch.current && (
        <div className="sm:hidden">
          <NumericKeypad
            label="輸入自訂價格"
            onInput={handleCustomKeyInput}
            onBackspace={handleCustomBackspace}
            onClear={handleCustomClear}
            onDone={handleCustomDone}
            onCancel={cancelCustomEditing}
          />
        </div>
      )}
    </div>
  );
};
