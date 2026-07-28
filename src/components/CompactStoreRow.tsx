import React from 'react';
import { SushiroStore, GroupQueue } from '../types';
import { formatGoogleMapsUrl } from '../utils/status';
import { Heart, MapPin, RefreshCw, ChevronRight, Plus, Check, Clock, Users } from 'lucide-react';

interface CompactStoreRowProps {
  store: SushiroStore;
  queue?: GroupQueue;
  queueLoading?: boolean;
  isBookmarked: boolean;
  isComparing: boolean;
  onToggleBookmark: (store: SushiroStore) => void;
  onToggleCompare: (store: SushiroStore) => void;
  onRefreshQueue: (storeId: number, storeName: string) => void;
  onSelectStore: (store: SushiroStore, mode?: 'live' | 'history') => void;
}

export const CompactStoreRow: React.FC<CompactStoreRowProps> = ({
  store,
  queue,
  queueLoading,
  isBookmarked,
  isComparing,
  onToggleBookmark,
  onToggleCompare,
  onRefreshQueue,
  onSelectStore,
}) => {
  const mapsUrl = formatGoogleMapsUrl(store.latitude, store.longitude, store.address, store.name);

  let accentColorClass = 'bg-neutral-300 dark:bg-neutral-700';
  let waitColorClass = 'text-neutral-900 dark:text-white';

  if (store.storeStatus === 'OPEN') {
    if (store.wait <= 0) {
      accentColorClass = 'bg-emerald-500';
      waitColorClass = 'text-emerald-600 dark:text-emerald-400';
    } else if (store.wait < 15) {
      accentColorClass = 'bg-amber-500';
      waitColorClass = 'text-amber-600 dark:text-amber-400';
    } else {
      accentColorClass = 'bg-[#E21F26]';
      waitColorClass = 'text-[#E21F26]';
    }
  }

  const isOpen = store.storeStatus === 'OPEN';

  return (
    <div className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-2.5 py-2 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all shadow-xs flex items-center gap-2 sm:gap-3 overflow-hidden">
      {/* Left Accent Bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColorClass}`} />

      {/* Area Badge */}
      <span className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-black text-[9px] uppercase tracking-wider shrink-0 ml-1">
        {store.area}
      </span>

      {/* Store Name */}
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <h4
          onClick={() => onSelectStore(store)}
          className="text-sm font-black text-neutral-900 dark:text-white truncate cursor-pointer hover:text-[#E21F26] transition-colors"
        >
          {store.name}
        </h4>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-neutral-400 hover:text-[#E21F26] transition-colors p-0.5 shrink-0"
          title="Google 地圖"
        >
          <MapPin className="w-3 h-3" />
        </a>
      </div>

      {/* Wait Time */}
      <div className="flex items-center gap-1 shrink-0">
        <Clock className="w-3 h-3 text-[#E21F26]" />
        <span className={`text-sm font-black tabular-nums whitespace-nowrap ${isOpen ? waitColorClass : 'text-neutral-400'}`}>
          {isOpen ? `${store.wait}分` : '休息'}
        </span>
      </div>

      {/* Separator */}
      <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700 shrink-0" />

      {/* Group Count */}
      <div className="flex items-center gap-1 shrink-0">
        <Users className="w-3 h-3 text-sky-500" />
        <span className="text-sm font-black text-neutral-900 dark:text-white tabular-nums whitespace-nowrap">
          {isOpen ? `${store.waitingGroup}組` : '--'}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onRefreshQueue(store.id, store.name)}
          disabled={queueLoading}
          className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
          title="更新叫號"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${queueLoading ? 'animate-spin text-[#E21F26]' : ''}`} />
        </button>

        <button
          onClick={() => onToggleBookmark(store)}
          className={`p-1.5 rounded transition-all cursor-pointer ${
            isBookmarked
              ? 'text-[#E21F26]'
              : 'text-neutral-500 hover:text-[#E21F26]'
          }`}
          title={isBookmarked ? '取消關注' : '加入關注'}
        >
          <Heart className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#E21F26]' : ''}`} />
        </button>

        <button
          onClick={() => onToggleCompare(store)}
          className={`p-1.5 rounded transition-all cursor-pointer ${
            isComparing
              ? 'text-[#141414] dark:text-white'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
          title={isComparing ? '取消比對' : '加入比對'}
        >
          {isComparing ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => onSelectStore(store, 'live')}
          className="flex items-center gap-0.5 px-2 py-1 bg-[#E21F26] hover:bg-red-700 text-white text-[10px] font-black uppercase transition-all cursor-pointer rounded"
        >
          <span>詳情</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
