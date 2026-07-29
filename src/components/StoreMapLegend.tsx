import React from 'react';

const LEGEND_ITEMS = [
  { color: '#10b981', label: '直入' },
  { color: '#f59e0b', label: '<30分' },
  { color: '#8b5cf6', label: '30-59分' },
  { color: '#f97316', label: '60-89分' },
  { color: '#aa151b', label: '≥90分' },
  { color: '#6b7280', label: '收工/停飛' },
];

export const StoreMapLegend: React.FC = () => {
  return (
    <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2.5">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};
