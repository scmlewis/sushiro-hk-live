import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { Combo } from '../hooks/useFareCalculator';
import { TierBadge } from './TierBadge';

interface CombinationSuggestionsProps {
  combinations: Combo[];
}

export const CombinationSuggestions: React.FC<CombinationSuggestionsProps> = ({ combinations }) => {
  const [expanded, setExpanded] = useState(false);

  if (combinations.length === 0) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl sm:rounded-[1.75rem] p-1.5 shadow-sm">
      <div className="bg-neutral-50/80 dark:bg-neutral-800/40 rounded-[1.35rem] border border-neutral-200/60 dark:border-white/5 p-4 sm:p-6">
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="w-full flex items-center justify-between gap-2 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider">
              追加建議
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-[10px] font-black text-amber-700 dark:text-amber-400">
              {combinations.length} 個組合
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-4">
                {combinations.map((combo, idx) => {
                  const counts: Record<number, number> = {};
                  combo.tiers.forEach((t) => {
                    counts[t.price] = (counts[t.price] || 0) + 1;
                  });
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 px-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {Object.entries(counts).map(([priceStr, count]) => {
                          const tier = combo.tiers.find((t) => t.price === Number(priceStr));
                          if (!tier) return null;
                          return (
                            <div key={priceStr} className="flex items-center gap-1">
                              <TierBadge tier={tier} size="sm" />
                              {count > 1 && (
                                <span className="text-[10px] font-black text-neutral-500">×{count}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <span className="text-sm font-black text-neutral-900 dark:text-white tabular-nums">
                        共 ${combo.total}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
