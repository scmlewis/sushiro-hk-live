import React from 'react';
import { Trash2 } from 'lucide-react';

interface FareBottomBarProps {
  totalItems: number;
  total: number;
  onClear: () => void;
}

const formatCurrency = (n: number) => `$${n.toLocaleString('zh-HK')}`;

export const FareBottomBar: React.FC<FareBottomBarProps> = ({ totalItems, total, onClear }) => {
  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-[#aa151b] text-white text-xs font-black">
              {totalItems} 項
            </span>
            <span className="text-lg font-black text-neutral-900 dark:text-white tabular-nums">
              {formatCurrency(total)}
            </span>
            <span className="text-[10px] font-bold text-neutral-400 hidden sm:inline">含服務費</span>
          </div>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-neutral-500 hover:text-[#aa151b] hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清空</span>
          </button>
        </div>
      </div>
    </div>
  );
};
