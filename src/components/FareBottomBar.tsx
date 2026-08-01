import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { SelectedEntry } from '../hooks/useFareCalculator';
import { TierBadge } from './TierBadge';
import { formatCurrency } from '../utils/formatCurrency';

interface FareBottomBarProps {
  totalItems: number;
  total: number;
  selectedList: SelectedEntry[];
  onClear: () => void;
}

export const FareBottomBar: React.FC<FareBottomBarProps> = ({
  totalItems,
  total,
  selectedList,
  onClear,
}) => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (totalItems === 0) setExpanded(false);
  }, [totalItems]);

  if (totalItems === 0) return null;

  const bar = (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="absolute bottom-full left-0 right-0 z-10"
          >
            <div className="bg-[#aa151b] shadow-[0_-4px_24px_rgba(170,21,27,0.35)] rounded-t-2xl">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-1 pt-3">
                <div className="max-h-[50vh] overflow-y-auto space-y-1.5 pb-1">
                  {selectedList.map((entry) => (
                    <div
                      key={entry.tier.price}
                      className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <TierBadge tier={entry.tier} size="sm" />
                        <span className="text-xs font-black text-white truncate">
                          {entry.tier.label || `$${entry.tier.price}`}
                        </span>
                        <span className="text-[10px] font-black text-white/70">×{entry.quantity}</span>
                      </div>
                      <span className="text-xs font-black text-white tabular-nums">
                        {formatCurrency(entry.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`bg-[#aa151b] transition-shadow duration-250 ${
          expanded ? '' : 'shadow-[0_-4px_24px_rgba(170,21,27,0.35)]'
        }`}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? '收起項目清單' : '展開項目清單'}
            className="flex items-center gap-3 rounded-xl px-1 cursor-pointer"
          >
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-black">
              {totalItems} 項
            </span>
            <span className="text-xl font-black text-white tabular-nums">{formatCurrency(total)}</span>
            <span className="text-[10px] font-bold text-white/70 hidden sm:inline">含服務費</span>
            <ChevronDown
              className={`w-4 h-4 text-white/80 transition-transform duration-250 ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清空</span>
          </button>
        </div>
      </div>
    </div>
  );

  const portalTarget = document.getElementById('fare-bottom-bar-root');
  return portalTarget ? createPortal(bar, portalTarget) : bar;
};
