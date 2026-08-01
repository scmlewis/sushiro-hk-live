import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { PriceTier } from '../data/menu';
import { TierBadge } from './TierBadge';

interface TierGridProps {
  allTiers: PriceTier[];
  mainTierPrices: number[];
  otherTierPrices: number[];
  quantities: Map<number, number>;
  onIncrement: (price: number) => void;
  onDecrement: (price: number) => void;
  onAddCustom: (price: number) => void;
  onToast?: (text: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

const CounterCard: React.FC<{
  tier: PriceTier;
  qty: number;
  onIncrement: () => void;
  onDecrement: () => void;
}> = ({ tier, qty, onIncrement, onDecrement }) => {
  return (
    <div className="flex items-center justify-between gap-3 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3 transition-all hover:border-neutral-300 dark:hover:border-neutral-700">
      <div className="flex items-center gap-3 min-w-0">
        <TierBadge tier={tier} />
        <div className="min-w-0">
          <div className="text-xs font-black text-neutral-900 dark:text-white truncate">
            ${tier.price}
          </div>
          <div className="text-[10px] font-bold text-neutral-400 truncate">{tier.label}</div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onDecrement}
          disabled={qty === 0}
          aria-label={`減少 ${tier.price} 數量`}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            qty === 0
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-95'
          }`}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-7 text-center text-base font-black text-neutral-900 dark:text-white tabular-nums">
          {qty}
        </span>
        <button
          onClick={onIncrement}
          aria-label={`增加 ${tier.price} 數量`}
          className="w-8 h-8 rounded-full bg-[#aa151b] text-white flex items-center justify-center transition-all hover:bg-red-700 active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
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
  onToast,
}) => {
  const [customPrice, setCustomPrice] = useState<string>('');

  const allKnownPrices = new Set([...mainTierPrices, ...otherTierPrices]);
  const getTier = (price: number) => allTiers.find((t) => t.price === price);
  const customRenderedTiers = allTiers.filter((t) => !allKnownPrices.has(t.price));

  const handleAddCustom = () => {
    const price = parseInt(customPrice, 10);
    if (isNaN(price) || price <= 0 || price > 1000) {
      onToast?.('請輸入有效價格 (1-1000)', 'error');
      return;
    }
    if (getTier(price)) {
      onToast?.('此價格層級已存在', 'warning');
      return;
    }
    onAddCustom(price);
    setCustomPrice('');
    onToast?.(`已新增 $${price} 價格層級`, 'success');
  };

  const totalItems = Array.from(quantities.values()).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Main plates */}
      <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl sm:rounded-[1.75rem] p-1.5 shadow-sm">
        <div className="bg-neutral-50/80 dark:bg-neutral-800/40 rounded-[1.35rem] border border-neutral-200/60 dark:border-white/5 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider">
              主要碟子
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-[10px] font-black text-neutral-600 dark:text-neutral-300">
              已選 {totalItems} 項
            </span>
          </div>
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
        </div>
      </div>

      {/* Other tiers */}
      <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl sm:rounded-[1.75rem] p-1.5 shadow-sm">
        <div className="bg-neutral-50/80 dark:bg-neutral-800/40 rounded-[1.35rem] border border-neutral-200/60 dark:border-white/5 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider">
              熱食 / 甜品 / 其他
            </h3>
          </div>

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
                  <div className="flex items-center justify-between mb-3">
                    <TierBadge tier={tier} size="sm" />
                    <span className="text-xs font-black text-neutral-900 dark:text-white">${price}</span>
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
        </div>
      </div>

      {/* Custom price */}
      <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl sm:rounded-[1.75rem] p-1.5 shadow-sm">
        <div className="bg-neutral-50/80 dark:bg-neutral-800/40 rounded-[1.35rem] border border-neutral-200/60 dark:border-white/5 p-4 sm:p-6">
          <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
            自訂價格
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-neutral-400">$</span>
            <input
              type="number"
              inputMode="numeric"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCustom();
              }}
              placeholder="自訂 $"
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-black text-neutral-900 dark:text-white outline-none focus:border-[#aa151b]"
                min={1}
                max={1000}
              />
            </div>
            <button
              onClick={handleAddCustom}
              aria-label="新增自訂價格"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#aa151b] text-white text-sm font-black transition-all hover:bg-red-700 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>新增</span>
            </button>
          </div>

          {customRenderedTiers.length > 0 && (
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {customRenderedTiers.map((tier) => (
                <CounterCard
                  key={tier.price}
                  tier={tier}
                  qty={quantities.get(tier.price) || 0}
                  onIncrement={() => onIncrement(tier.price)}
                  onDecrement={() => onDecrement(tier.price)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
