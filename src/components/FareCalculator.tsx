import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PriceTier, PRICE_TIERS } from '../data/menu';
import { Calculator, Filter, Trash2, RotateCcw, Plus, Minus, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface FareCalculatorProps {
  onToast?: (text: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const FareCalculator: React.FC<FareCalculatorProps> = ({ onToast }) => {
  const [selectedTiers, setSelectedTiers] = useState<Map<number, number>>(new Map());
  const [targetBudget, setTargetBudget] = useState<number>(80);

  const TAX_RATE = 0.1;

  const selectedList = useMemo(() => {
    const list: { tier: PriceTier; quantity: number; subtotal: number }[] = [];
    selectedTiers.forEach((qty, price) => {
      const tier = PRICE_TIERS.find((t) => t.price === price);
      if (tier) {
        list.push({ tier, quantity: qty, subtotal: tier.price * qty });
      }
    });
    return list;
  }, [selectedTiers]);

  const subtotal = useMemo(() => selectedList.reduce((sum, entry) => sum + entry.subtotal, 0), [selectedList]);
  const tax = useMemo(() => Math.round(subtotal * TAX_RATE), [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);
  const remaining = useMemo(() => targetBudget - total, [targetBudget, total]);

  const combinations = useMemo(() => {
    if (total === 0 || remaining < 0) return [];
    const results: { tiers: PriceTier[]; total: number }[] = [];
    const tiers = PRICE_TIERS.filter((t) => t.price <= remaining);
    const findCombinations = (startIdx: number, current: PriceTier[], currentTotal: number) => {
      if (currentTotal >= remaining - 5 && currentTotal <= remaining + 5) {
        results.push({ tiers: [...current], total: currentTotal });
        return;
      }
      if (currentTotal > remaining + 5) return;
      for (let i = startIdx; i < tiers.length; i++) {
        current.push(tiers[i]);
        findCombinations(i, current, currentTotal + tiers[i].price);
        current.pop();
      }
    };
    findCombinations(0, [], 0);
    return results.slice(0, 6);
  }, [remaining, total]);

  const handleToggleTier = useCallback((tier: PriceTier) => {
    setSelectedTiers((prev) => {
      const next = new Map(prev);
      const current = next.get(tier.price) || 0;
      if (current > 0) {
        if (current === 1) {
          next.delete(tier.price);
        } else {
          next.set(tier.price, current - 1);
        }
      } else {
        next.set(tier.price, 1);
      }
      return next;
    });
  }, []);

  const handleIncrement = useCallback((tier: PriceTier) => {
    setSelectedTiers((prev) => {
      const next = new Map(prev);
      next.set(tier.price, (next.get(tier.price) || 0) + 1);
      return next;
    });
  }, []);

  const handleDecrement = useCallback((tier: PriceTier) => {
    setSelectedTiers((prev) => {
      const next = new Map(prev);
      const current = next.get(tier.price) || 0;
      if (current <= 1) {
        next.delete(tier.price);
      } else {
        next.set(tier.price, current - 1);
      }
      return next;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedTiers(new Map());
    onToast?.('已清除所有選擇', 'info');
  }, [onToast]);

  const handleSetBudget = useCallback((amount: number) => {
    setTargetBudget(amount);
  }, []);

  const totalItems = useMemo(() => selectedList.reduce((sum, e) => sum + e.quantity, 0), [selectedList]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Budget & Summary Cards */}
      <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#aa151b]" />
            <span>價格計算器</span>
          </h3>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-[#aa151b] transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清除</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700 text-center">
            <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">目標預算</div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-lg font-black text-neutral-900 dark:text-white">$</span>
              <input
                type="number"
                value={targetBudget}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0 && val <= 1000) setTargetBudget(val);
                }}
                className="w-16 bg-transparent text-center text-lg font-black text-neutral-900 dark:text-white outline-none border-none"
                min={1}
                max={1000}
              />
            </div>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700 text-center">
            <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">當前總額</div>
            <div className="text-lg font-black text-[#aa151b] tabular-nums">${subtotal}</div>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700 text-center">
            <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">含稅 (+10%)</div>
            <div className="text-lg font-black text-neutral-900 dark:text-white tabular-nums">${total}</div>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700 text-center">
            <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">剩餘金額</div>
            <div className={`text-lg font-black tabular-nums ${remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              ${Math.abs(remaining)}
            </div>
          </div>
        </div>

        {remaining < 0 && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>已超出預算 ${Math.abs(remaining)}，請移除部分項目</span>
          </div>
        )}

        {remaining >= 0 && total > 0 && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>預算內，尚餘 ${remaining}</span>
          </div>
        )}
      </div>

      {/* Quick Budget Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[50, 80, 100, 120, 150, 200].map((amount) => (
          <button
            key={amount}
            onClick={() => handleSetBudget(amount)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer border-2 ${
              targetBudget === amount
                ? 'bg-[#aa151b] text-white border-[#aa151b]'
                : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-[#aa151b]'
            }`}
          >
            ${amount}
          </button>
        ))}
      </div>

      {/* Price Tier Buttons */}
      <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#aa151b]" />
            <span>價格層級</span>
          </h3>
          <span className="text-xs font-bold text-neutral-400">
            已選 {totalItems} 項
          </span>
        </div>
        <div className="relative mb-6 sm:mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/5 pointer-events-none"></div>
          <div className="h-3 sm:h-4 bg-[#E0E0E0] rounded-full mb-1 sm:mb-2"></div>
          <div className="flex justify-end items-center mb-2 px-2">
            <div className="flex space-x-2">
              <button
                onClick={handleClearAll}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 w-8 cursor-pointer"
                title="清除"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
              <button
                onClick={() => setSelectedTiers(new Map())}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 w-8 cursor-pointer"
                title="重置"
              >
                <RotateCcw className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          <div className="pb-2 sm:pb-4 overflow-x-auto">
            <div className="flex gap-2 sm:gap-4 min-w-max px-2 sm:px-4 py-1 sm:py-2">
              {PRICE_TIERS.map((tier) => {
                const qty = selectedTiers.get(tier.price) || 0;
                return (
                  <button
                    key={tier.price}
                    onClick={() => handleToggleTier(tier)}
                    className={`relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-full border-2 sm:border-4 border-white transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-md ${
                      qty > 0
                        ? 'border-[#aa151b] bg-red-50 dark:bg-red-950/30'
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                    }`}
                    style={{ minWidth: '4rem', minHeight: '4rem' }}
                  >
                    {qty > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#aa151b] text-white text-[10px] font-black rounded-full flex items-center justify-center">
                        {qty}
                      </div>
                    )}
                    <span className="text-2xl sm:text-3xl mb-1">{tier.emoji}</span>
                    <span className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
                      {tier.label}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-neutral-400 mt-0.5">
                      {tier.count} 款
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="h-3 sm:h-4 bg-[#E0E0E0] rounded-full mt-1 sm:mt-2"></div>
        </div>
      </div>

      {/* Selected Items */}
      <AnimatePresence>
        {selectedList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>已選擇的壽司</span>
                <span className="px-2 py-0.5 bg-[#aa151b] text-white text-[10px] font-black rounded-full">
                  {totalItems} 項
                </span>
              </h3>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-[#aa151b] transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清空</span>
              </button>
            </div>
            <div className="space-y-2">
              {selectedList.map((entry) => (
                <div
                  key={entry.tier.price}
                  className="flex items-center justify-between py-2 px-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{entry.tier.emoji}</span>
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">{entry.tier.label}</div>
                      <div className="text-[10px] text-neutral-400">{entry.tier.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">×{entry.quantity}</span>
                    <span className="text-sm font-black text-neutral-900 dark:text-white tabular-nums">${entry.subtotal}</span>
                    <button
                      onClick={() => handleDecrement(entry.tier)}
                      className="w-6 h-6 rounded-full bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 flex items-center justify-center text-xs font-bold text-neutral-600 hover:text-[#aa151b] transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleIncrement(entry.tier)}
                      className="w-6 h-6 rounded-full bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 flex items-center justify-center text-xs font-bold text-neutral-600 hover:text-[#aa151b] transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500">小計 (含稅)</span>
              <span className="text-lg font-black text-[#aa151b] tabular-nums">${total}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combination Suggestions */}
      <AnimatePresence>
        {combinations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm"
          >
            <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-[#aa151b]" />
              <span>接近預算的組合</span>
            </h3>
            <div className="space-y-2">
              {combinations.map((combo, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 px-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {combo.tiers.map((tier) => (
                      <span key={tier.price} className="text-lg" title={tier.description}>
                        {tier.emoji}
                      </span>
                    ))}
                    <span className="text-xs text-neutral-400">
                      {combo.tiers.map((t) => t.label).join(' + ')}
                    </span>
                  </div>
                  <span className="text-sm font-black text-neutral-900 dark:text-white tabular-nums">${combo.total}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {total === 0 && (
        <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 sm:p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto mb-4">
            <Calculator className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-2">尚未選擇壽司</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            點擊上方的價格層級按鈕添加到您的選擇
          </p>
        </div>
      )}
    </div>
  );
};