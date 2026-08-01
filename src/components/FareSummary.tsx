import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import { NumericKeypad } from './NumericKeypad';

interface FareSummaryProps {
  targetBudget: number;
  actualBill: number;
  subtotal: number;
  serviceCharge: number;
  total: number;
  remaining: number;
  onTargetChange: (value: number) => void;
  onActualChange: (value: number) => void;
}

const formatCurrency = (n: number) => `$${n.toLocaleString('zh-HK')}`;

export const FareSummary: React.FC<FareSummaryProps> = ({
  targetBudget,
  actualBill,
  subtotal,
  serviceCharge,
  total,
  remaining,
  onTargetChange,
  onActualChange,
}) => {
  const [activeField, setActiveField] = useState<'target' | 'actual' | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const targetInputRef = useRef<HTMLInputElement>(null);
  const actualInputRef = useRef<HTMLInputElement>(null);
  const isTouch = useRef(false);

  useEffect(() => {
    const handler = (e: TouchEvent) => {
      isTouch.current = true;
    };
    window.addEventListener('touchstart', handler, { passive: true });
    return () => window.removeEventListener('touchstart', handler);
  }, []);

  const startEditing = (field: 'target' | 'actual') => {
    setActiveField(field);
    setEditingValue(String(field === 'target' ? targetBudget : actualBill));
  };

  const handleKeyInput = (digit: string) => {
    setEditingValue((prev) => {
      const next = prev === '0' ? digit : prev + digit;
      return next.length > 4 ? prev : next;
    });
  };

  const handleBackspace = () => {
    setEditingValue((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
  };

  const handleClear = () => setEditingValue('0');

  const commit = () => {
    const parsed = parseInt(editingValue, 10);
    if (!isNaN(parsed)) {
      if (activeField === 'target') onTargetChange(parsed);
      else onActualChange(parsed);
    }
    setActiveField(null);
  };

  const handleNativeChange = (field: 'target' | 'actual', value: string) => {
    setEditingValue(value || '0');
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 1000) {
      if (field === 'target') onTargetChange(parsed);
      else onActualChange(parsed);
    }
  };

  const handleBlur = () => {
    if (activeField) commit();
  };

  const overBudget = remaining < 0;

  return (
    <div className="relative">
      <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl sm:rounded-[1.75rem] p-1.5 shadow-sm">
        <div className="bg-neutral-50/80 dark:bg-neutral-800/40 rounded-[1.35rem] border border-neutral-200/60 dark:border-white/5 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#aa151b]/10 flex items-center justify-center">
                <Calculator className="w-4 h-4 text-[#aa151b]" />
              </div>
              <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider">
                價格計算器
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-neutral-200/60 dark:bg-white/10 text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
              加一服務費 10%
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Target budget */}
            <div
              className={`bg-white dark:bg-neutral-900 rounded-2xl border-2 p-4 text-center transition-all ${
                activeField === 'target'
                  ? 'border-[#aa151b] shadow-[0_0_0_3px_rgba(170,21,27,0.12)]'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              <label
                htmlFor="target-budget"
                className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2"
              >
                目標價格
              </label>
              <div className="flex items-center justify-center gap-0.5">
                <span className="text-lg font-black text-neutral-500 dark:text-neutral-400">$</span>
                <input
                  ref={targetInputRef}
                  id="target-budget"
                  type="number"
                  inputMode={activeField ? 'none' : 'numeric'}
                  aria-label="目標價格"
                  value={activeField === 'target' ? editingValue : targetBudget}
                  onFocus={() => startEditing('target')}
                  onChange={(e) => handleNativeChange('target', e.target.value)}
                  onBlur={handleBlur}
                  readOnly={!!(isTouch.current && activeField === 'target')}
                  className="w-20 bg-transparent text-center text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white outline-none tabular-nums"
                  min={1}
                  max={1000}
                />
              </div>
            </div>

            {/* Actual bill */}
            <div
              className={`bg-white dark:bg-neutral-900 rounded-2xl border-2 p-4 text-center transition-all ${
                activeField === 'actual'
                  ? 'border-[#aa151b] shadow-[0_0_0_3px_rgba(170,21,27,0.12)]'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              <label
                htmlFor="actual-bill"
                className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2"
              >
                實際賬單 (+10%)
              </label>
              <div className="flex items-center justify-center gap-0.5">
                <span className="text-lg font-black text-neutral-500 dark:text-neutral-400">$</span>
                <input
                  ref={actualInputRef}
                  id="actual-bill"
                  type="number"
                  inputMode={activeField ? 'none' : 'numeric'}
                  aria-label="實際賬單"
                  value={activeField === 'actual' ? editingValue : actualBill}
                  onFocus={() => startEditing('actual')}
                  onChange={(e) => handleNativeChange('actual', e.target.value)}
                  onBlur={handleBlur}
                  readOnly={!!(isTouch.current && activeField === 'actual')}
                  className="w-20 bg-transparent text-center text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white outline-none tabular-nums"
                  min={1}
                  max={1100}
                />
              </div>
            </div>

            {/* Subtotal / service charge display */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 text-center">
              <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
                目前金額
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#aa151b] tabular-nums">
                {formatCurrency(subtotal)}
              </div>
              <div className="mt-1 text-[10px] font-bold text-neutral-400">
                加一 ${serviceCharge}
              </div>
            </div>

            {/* Remaining / over-budget */}
            <div
              className={`rounded-2xl border p-4 text-center ${
                overBudget
                  ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                  : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30'
              }`}
            >
              <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
                {overBudget ? '已超出' : '尚餘'}
              </div>
              <div
                className={`text-2xl sm:text-3xl font-black tabular-nums ${
                  overBudget ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatCurrency(Math.abs(remaining))}
              </div>
            </div>
          </div>

          {overBudget && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-xl text-xs font-bold text-red-700 dark:text-red-300"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>已超出預算 {formatCurrency(Math.abs(remaining))}，請移除部分項目</span>
            </motion.div>
          )}

          {!overBudget && total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>預算內，尚需 {formatCurrency(remaining)}</span>
            </motion.div>
          )}
        </div>
      </div>

      {activeField && isTouch.current && (
        <div className="sm:hidden">
          <NumericKeypad
            label={activeField === 'target' ? '輸入目標價格' : '輸入實際賬單'}
            onInput={handleKeyInput}
            onBackspace={handleBackspace}
            onClear={handleClear}
            onDone={commit}
          />
        </div>
      )}
    </div>
  );
};
