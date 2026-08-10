import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Trash2, X, ClipboardCopy } from 'lucide-react';
import { SelectedEntry } from '../hooks/useFareCalculator';
import { TierBadge } from './TierBadge';
import { formatCurrency } from '../utils/formatCurrency';

interface FareBottomBarProps {
  totalItems: number;
  total: number;
  selectedList: SelectedEntry[];
  onClear: () => void;
  peopleCount: number;
  onCopySplit?: () => void;
}

const CONFIRM_TIMEOUT_MS = 3000;

export const FareBottomBar: React.FC<FareBottomBarProps> = ({
  totalItems,
  total,
  selectedList,
  onClear,
  peopleCount,
  onCopySplit,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expanded]);

  useEffect(() => {
    if (totalItems === 0) setExpanded(false);
  }, [totalItems]);

  useEffect(() => {
    if (totalItems === 0) setConfirming(false);
  }, [totalItems]);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  if (totalItems === 0 && !(peopleCount >= 2 && onCopySplit)) return null;

  const requestClear = () => {
    if (confirming) {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      setConfirming(false);
      onClear();
      return;
    }
    setConfirming(true);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setConfirming(false), CONFIRM_TIMEOUT_MS);
  };

  const cancelConfirm = () => {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setConfirming(false);
  };

  const bar = (
    <div ref={barRef} className="fixed bottom-0 left-0 right-0 z-40 px-2 pb-2">
      <div className="relative">
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="absolute bottom-full left-0 right-0 mb-2 z-10"
            >
              <div className="bg-[#aa151b] shadow-[0_-4px_24px_rgba(170,21,27,0.35)] rounded-2xl">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-1 pt-3">
                  <div className="max-h-[50vh] overflow-y-auto space-y-1.5 pb-1">
                    {selectedList.map((entry) => (
                      <div
                        key={entry.tier.price}
                        data-testid="bar-list-row"
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
          className={`bg-[#aa151b] rounded-2xl transition-shadow duration-250 ${
            expanded ? '' : 'shadow-[0_-4px_24px_rgba(170,21,27,0.35)]'
          }`}
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
            <button
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-label={expanded ? '收起項目清單' : '展開項目清單'}
              className="flex items-center gap-2.5 rounded-xl px-1 cursor-pointer min-w-0"
            >
              <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-black shrink-0">
                {totalItems} 項
              </span>
              <span className="text-xs font-bold text-white/70 whitespace-nowrap">總額 (含服務費)</span>
              <span className="text-xl font-black text-white tabular-nums whitespace-nowrap">
                {formatCurrency(total)}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-white/80 transition-transform duration-250 shrink-0 ${
                  expanded ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5">
              {peopleCount >= 2 && onCopySplit && (
                <button
                  onClick={onCopySplit}
                  aria-label="複製分帳"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-black transition-all hover:bg-white/30 active:scale-95"
                >
                  <ClipboardCopy className="w-3.5 h-3.5" />
                  <span>複製分帳</span>
                </button>
              )}
              {confirming ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={cancelConfirm}
                    aria-label="取消清空"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={requestClear}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#aa151b] text-xs font-black transition-all hover:bg-red-50 active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>確認清空?</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={requestClear}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>清空</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const portalTarget = document.getElementById('fare-bottom-bar-root');
  return portalTarget ? createPortal(bar, portalTarget) : bar;
};
