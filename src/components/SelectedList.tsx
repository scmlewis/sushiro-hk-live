import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Minus, Plus } from 'lucide-react';
import { SelectedEntry } from '../hooks/useFareCalculator';
import { TierBadge } from './TierBadge';

interface SelectedListProps {
  items: SelectedEntry[];
  total: number;
  onIncrement: (price: number) => void;
  onDecrement: (price: number) => void;
  onRemove: (price: number) => void;
  onClearAll: () => void;
}

export const SelectedList: React.FC<SelectedListProps> = ({
  items,
  total,
  onIncrement,
  onDecrement,
  onRemove,
  onClearAll,
}) => {
  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl sm:rounded-[1.75rem] p-1.5 shadow-sm"
    >
      <div className="bg-neutral-50/80 dark:bg-neutral-800/40 rounded-[1.35rem] border border-neutral-200/60 dark:border-white/5 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span>已選擇</span>
            <span className="px-2 py-0.5 bg-[#aa151b] text-white text-[10px] font-black rounded-full">
              {items.reduce((sum, e) => sum + e.quantity, 0)} 項
            </span>
          </h3>
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-[#aa151b] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清空</span>
          </button>
        </div>

        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {items.map((entry) => (
              <motion.div
                key={entry.tier.price}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between py-2 px-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TierBadge tier={entry.tier} size="sm" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      ${entry.tier.price}
                    </div>
                    <div className="text-[10px] font-bold text-neutral-400">
                      小計 ${entry.subtotal}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDecrement(entry.tier.price)}
                    aria-label={`減少 ${entry.tier.price}`}
                    className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-[#aa151b] transition-colors active:scale-95"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-black text-neutral-900 dark:text-white tabular-nums">
                    {entry.quantity}
                  </span>
                  <button
                    onClick={() => onIncrement(entry.tier.price)}
                    aria-label={`增加 ${entry.tier.price}`}
                    className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-[#aa151b] transition-colors active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onRemove(entry.tier.price)}
                    aria-label={`移除 ${entry.tier.price}`}
                    className="ml-1 w-6 h-6 rounded-full text-neutral-400 hover:text-[#aa151b] transition-colors flex items-center justify-center"
                  >
                    <span className="text-lg leading-none">×</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-500">合計（含加一服務費）</span>
          <span className="text-xl font-black text-[#aa151b] tabular-nums">${total}</span>
        </div>
      </div>
    </motion.div>
  );
};
