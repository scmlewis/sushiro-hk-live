import React from 'react';

const LEGEND_ITEMS = [
  { color: '#10b981', label: '直入' },
  { color: '#f59e0b', label: '<15分' },
  { color: '#8b5cf6', label: '15-29分' },
  { color: '#f97316', label: '30-59分' },
  { color: '#aa151b', label: '≥60分' },
  { color: '#6b7280', label: '休息/收工' },
];

export const StoreMapLegend: React.FC = () => {
  return (
    <div className="absolute bottom-4 right-4 z-[1000] bg-neutral-900/95 backdrop-blur-sm rounded-lg shadow-lg border border-neutral-700 px-3 py-2.5">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[10px] font-bold text-neutral-300 whitespace-nowrap">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};
