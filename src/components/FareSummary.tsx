import React, { useState, useRef } from 'react';
import { Calculator, Pencil } from 'lucide-react';
import { NumericKeypad } from './NumericKeypad';
import { useIsTouch } from '../hooks/useIsTouch';
import { formatCurrency } from '../utils/formatCurrency';
import { Card } from './Card';

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
  const isTouch = useIsTouch();

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
    if (activeField && !isTouch.current) commit();
  };

  const overBudget = remaining < 0;

  return (
    <div className="relative">
      <Card>
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
            onClick={() => targetInputRef.current?.focus()}
            className={`bg-white dark:bg-neutral-900 rounded-2xl border-2 p-4 text-center cursor-pointer transition-all ${
              activeField === 'target'
                ? 'border-[#aa151b] shadow-[0_0_0_3px_rgba(170,21,27,0.12)]'
                : 'border-neutral-200 dark:border-neutral-800 hover:border-[#aa151b]/50 hover:shadow-[0_0_0_3px_rgba(170,21,27,0.06)]'
            }`}
          >
            <label
              htmlFor="target-budget"
              className="flex items-center justify-center gap-1 text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 cursor-pointer"
            >
              目標價格
              <Pencil className="w-3 h-3 text-neutral-400" />
            </label>
            <div className="flex items-center justify-center">
              <span className="text-lg font-black text-neutral-500 dark:text-neutral-400 mr-0.5">$</span>
              <input
                ref={targetInputRef}
                id="target-budget"
                type="number"
                inputMode={isTouch.current ? 'none' : 'numeric'}
                aria-label="目標價格"
                value={activeField === 'target' ? editingValue : targetBudget}
                onFocus={() => startEditing('target')}
                onChange={(e) => handleNativeChange('target', e.target.value)}
                onBlur={handleBlur}
                readOnly={isTouch.current}
                className="w-20 bg-transparent text-center text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white outline-none tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                min={1}
                max={1000}
              />
            </div>
            <div className="mt-2 flex items-center justify-center gap-1 text-[9px] font-black text-[#aa151b] uppercase tracking-widest">
              <Pencil className="w-2.5 h-2.5" />
              <span>{isTouch.current ? '點擊輸入' : '點擊調整'}</span>
            </div>
          </div>

          {/* Actual bill */}
          <div
            onClick={() => actualInputRef.current?.focus()}
            className={`bg-white dark:bg-neutral-900 rounded-2xl border-2 p-4 text-center cursor-pointer transition-all ${
              activeField === 'actual'
                ? 'border-[#aa151b] shadow-[0_0_0_3px_rgba(170,21,27,0.12)]'
                : 'border-neutral-200 dark:border-neutral-800 hover:border-[#aa151b]/50 hover:shadow-[0_0_0_3px_rgba(170,21,27,0.06)]'
            }`}
          >
            <label
              htmlFor="actual-bill"
              className="flex items-center justify-center gap-1 text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 cursor-pointer"
            >
              實際賬單 (+10%)
              <Pencil className="w-3 h-3 text-neutral-400" />
            </label>
            <div className="flex items-center justify-center">
              <span className="text-lg font-black text-neutral-500 dark:text-neutral-400 mr-0.5">$</span>
              <input
                ref={actualInputRef}
                id="actual-bill"
                type="number"
                inputMode={isTouch.current ? 'none' : 'numeric'}
                aria-label="實際賬單"
                value={activeField === 'actual' ? editingValue : actualBill}
                onFocus={() => startEditing('actual')}
                onChange={(e) => handleNativeChange('actual', e.target.value)}
                onBlur={handleBlur}
                readOnly={isTouch.current}
                className="w-20 bg-transparent text-center text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white outline-none tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                min={1}
                max={1100}
              />
            </div>
            <div className="mt-2 flex items-center justify-center gap-1 text-[9px] font-black text-[#aa151b] uppercase tracking-widest">
              <Pencil className="w-2.5 h-2.5" />
              <span>{isTouch.current ? '點擊輸入' : '點擊調整'}</span>
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
              {overBudget ? '已超出（對比目標）' : '尚餘（對比目標）'}
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
      </Card>

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
