import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PriceTier, PRICE_TIERS, getTierByPrice } from '../data/menu';
import { Calculator, Trash2, RotateCcw, Plus, Minus, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface FareCalculatorProps {
  onToast?: (text: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

const MAIN_PLATINUM_TIERS = [12, 17, 22, 27];
const OTHER_PLATINUM_TIERS = [10, 13, 18, 19, 22, 27, 28, 33, 38, 39];

export const FareCalculator: React.FC<FareCalculatorProps> = ({ onToast }) => {
  const [selectedTiers, setSelectedTiers] = useState<Map<number, number>>(new Map());
  const [targetBudget, setTargetBudget] = useState<number>(80);
  const [deletionMode, setDeletionMode] = useState(false);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const SERVICE_CHARGE_RATE = 0.1;

  const allTiers = useMemo(() => {
    const parsed = parseInt(customPrice, 10);
    if (!isNaN(parsed) && parsed > 0) {
      const exists = PRICE_TIERS.some((t) => t.price === parsed);
      if (!exists) {
        const custom: PriceTier = { price: parsed, color: '#000000', bgColor: '#E5E7EB', borderColor: '#D1D5DB' };
        return [...PRICE_TIERS, custom];
      }
    }
    return PRICE_TIERS;
  }, [customPrice]);

  const selectedList = useMemo(() => {
    const list: { tier: PriceTier; quantity: number; subtotal: number }[] = [];
    selectedTiers.forEach((qty, price) => {
      const tier = getTierByPrice(price) || allTiers.find((t) => t.price === price);
      if (tier) {
        list.push({ tier, quantity: qty, subtotal: tier.price * qty });
      }
    });
    return list;
  }, [selectedTiers, allTiers]);

  const subtotal = useMemo(() => selectedList.reduce((sum, entry) => sum + entry.subtotal, 0), [selectedList]);
  const serviceCharge = useMemo(() => Math.round(subtotal * SERVICE_CHARGE_RATE), [subtotal]);
  const total = useMemo(() => subtotal + serviceCharge, [subtotal, serviceCharge]);
  const remaining = useMemo(() => targetBudget - total, [targetBudget, total]);

  const combinations = useMemo(() => {
    if (total === 0 || remaining < 0) return [];
    const results: { tiers: PriceTier[]; total: number }[] = [];
    const tiers = allTiers.filter((t) => t.price <= remaining);
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
  }, [remaining, total, allTiers]);

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

  const handleAddCustomTier = useCallback(() => {
    const price = parseInt(customPrice, 10);
    if (!isNaN(price) && price > 0 && price <= 1000) {
      const exists = PRICE_TIERS.find((t) => t.price === price);
      if (!exists) {
        setCustomPrice('');
        setShowCustomInput(false);
        onToast?.(`已新增 $${price} 價格層級`, 'success');
      } else {
        onToast?.('此價格層級已存在', 'warning');
      }
    } else {
      onToast?.('請輸入有效價格 (1-1000)', 'error');
    }
  }, [customPrice, onToast]);

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
            onClick={() => setDeletionMode(!deletionMode)}
            className={`flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer ${
              deletionMode
                ? 'text-[#aa151b] bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded-lg border border-red-200 dark:border-red-800'
                : 'text-neutral-500 hover:text-[#aa151b]'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deletionMode ? '刪除模式' : '刪除'}</span>
          </button>
        </div>

        {/* Input Group */}
        <div className="bg-neutral-100 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 sm:p-4 mb-3">
          <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2 px-1">輸入</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700 text-center shadow-sm">
              <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">目標價格</div>
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
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700 text-center shadow-sm">
              <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">實際賬單 (+10%)</div>
              <div className="text-lg font-black text-neutral-900 dark:text-white tabular-nums">${total}</div>
            </div>
          </div>
        </div>

        {/* Output Group */}
        <div className="bg-neutral-100 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 sm:p-4">
          <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2 px-1">輸出</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700 text-center shadow-sm">
              <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">目前金額</div>
              <div className="text-lg font-black text-[#aa151b] tabular-nums">${subtotal}</div>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700 text-center shadow-sm">
              <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">剩餘金額</div>
              <div className={`text-lg font-black tabular-nums ${remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                ${Math.abs(remaining)}
              </div>
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

      {/* Main Plate Tiers */}
      <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#aa151b]" />
            <span>主要碟子</span>
          </h3>
          <span className="text-xs font-bold text-neutral-400">
            已選 {totalItems} 項
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {MAIN_PLATINUM_TIERS.map((price) => {
            const tier = allTiers.find((t) => t.price === price);
            if (!tier) return null;
            const qty = selectedTiers.get(price) || 0;
            return (
              <div
                key={price}
                className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black"
                      style={{ backgroundColor: tier.bgColor, color: tier.color, border: `2px solid ${tier.borderColor}` }}
                    >
                      ${price}
                    </div>
                    <span className="text-sm font-black text-neutral-900 dark:text-white">${price}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecrement(tier)}
                      disabled={qty === 0}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                        qty === 0
                          ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
                          : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                      }`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-lg font-black text-neutral-900 dark:text-white tabular-nums">{qty}</span>
                    <button
                      onClick={() => handleIncrement(tier)}
                      className="w-8 h-8 rounded-full bg-[#aa151b] text-white flex items-center justify-center transition-colors cursor-pointer hover:bg-red-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Other Price Tiers */}
        <div className="mb-6">
          <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 px-1">熱食 / 甜品 / 其他</div>
          <div className="flex flex-wrap gap-2">
            {OTHER_PLATINUM_TIERS.map((price) => {
              const tier = allTiers.find((t) => t.price === price);
              if (!tier) return null;
              const qty = selectedTiers.get(price) || 0;
              return (
                <button
                  key={price}
                  onClick={() => handleIncrement(tier)}
                  className={`px-4 py-2 rounded-lg text-sm font-black transition-all cursor-pointer border-2 ${
                    qty > 0
                      ? 'bg-[#aa151b] text-white border-[#aa151b]'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-[#aa151b]'
                  }`}
                >
                  ${price}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Price Input */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
            placeholder="自訂 $"
            className="flex-1 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-black text-neutral-900 dark:text-white outline-none"
            min={1}
            max={1000}
          />
          <button
            onClick={() => { setShowCustomInput(!showCustomInput); handleAddCustomTier(); }}
            className="w-10 h-10 rounded-lg bg-[#1a1a2e] text-white flex items-center justify-center transition-colors cursor-pointer hover:bg-[#16213e]"
          >
            <Plus className="w-5 h-5" />
          </button>
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
                <span>已選擇</span>
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
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ backgroundColor: entry.tier.bgColor, color: entry.tier.color, border: `2px solid ${entry.tier.borderColor}` }}
                    >
                      ${entry.tier.price}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">{entry.tier.label}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecrement(entry.tier)}
                      className="w-7 h-7 rounded-full bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 flex items-center justify-center text-xs font-bold text-neutral-600 hover:text-[#aa151b] transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-black text-neutral-900 dark:text-white tabular-nums">{entry.quantity}</span>
                    <button
                      onClick={() => handleIncrement(entry.tier)}
                      className="w-7 h-7 rounded-full bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 flex items-center justify-center text-xs font-bold text-neutral-600 hover:text-[#aa151b] transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-black text-neutral-900 dark:text-white tabular-nums">${entry.subtotal}</span>
                    <button
                      onClick={() => {
                        setSelectedTiers((prev) => {
                          const next = new Map(prev);
                          next.delete(entry.tier.price);
                          return next;
                        });
                      }}
                      className="w-6 h-6 rounded-full text-neutral-400 hover:text-[#aa151b] transition-colors cursor-pointer flex items-center justify-center"
                    >
                      <span className="text-lg leading-none">×</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500">小計 (加一服務費)</span>
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
                      <span key={tier.price} className="text-xs font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: tier.bgColor, color: tier.color, border: `1px solid ${tier.borderColor}` }}>
                        ${tier.price}
                      </span>
                    ))}
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
          <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-2">尚未選擇價格層級</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            點擊上方的價格層級按鈕添加到您的選擇
          </p>
        </div>
      )}
    </div>
  );
};