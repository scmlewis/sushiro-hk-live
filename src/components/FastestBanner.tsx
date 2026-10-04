// src/components/FastestBanner.tsx
import React, { useMemo } from 'react';
import { Zap } from 'lucide-react';
import type { SushiroStore } from '../types';
import { getFastestStores } from '../utils/getFastestStores';

interface Props {
  stores: SushiroStore[];
  hasLocation: boolean;
  onSelect: (s: SushiroStore) => void;
}

export const FastestBanner: React.FC<Props> = ({ stores, hasLocation, onSelect }) => {
  const top = useMemo(() => getFastestStores(stores, 3), [stores]);
  if (top.length === 0) return null;
  return (
    <div className="mb-3 p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-1.5 mb-2 text-xs font-black uppercase tracking-wider text-neutral-500">
        <Zap className="w-3.5 h-3.5 text-[#aa151b]" />
        <span>⚡ 最快 3 間 · OPEN NOW</span>
        {!hasLocation && <span className="ml-auto font-bold normal-case text-neutral-400">啟用 GPS 顯示距離</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {top.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-[#aa151b] text-left cursor-pointer active:scale-95 transition-all"
          >
            <div className="text-xs font-black truncate text-neutral-900 dark:text-white">{s.name}</div>
            <div className="text-sm font-black text-[#aa151b] tabular-nums">{s.wait}分 · {s.waitingGroup}組</div>
            {hasLocation && s.distanceKm !== undefined && (
              <div className="text-[11px] text-neutral-400 tabular-nums">{s.distanceKm.toFixed(1)}km</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
