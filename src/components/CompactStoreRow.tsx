import React from 'react';
import { SushiroStore, GroupQueue } from '../types';
import { formatGoogleMapsUrl, getStoreDisplayStatus } from '../utils/status';
import { getAccentBgClass, getWaitTextColor } from '../utils/colors';
import { Heart, MapPin, RefreshCw, ChevronRight, Plus, Check, Clock, Users, Navigation } from 'lucide-react';

const SITE_URL = 'https://sushiro-hk-live.vercel.app';

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

  const displayStatus = getStoreDisplayStatus(store);

  const accentColorClass = getAccentBgClass(displayStatus.accentColor);
  const waitColorClass = getWaitTextColor(displayStatus.waitText, displayStatus.accentColor);

  return (
    <div className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-200 overflow-hidden">
      {/* Left Accent Bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColorClass}`} />

      {/* Row 1: Status — name, wait time, group count */}
      <div className="flex items-center gap-2 px-3 py-2.5 ml-1">
        <a
          href={`/store/${store.id}`}
          onClick={(e) => { e.preventDefault(); onSelectStore(store); }}
          className="text-sm font-black text-neutral-900 dark:text-white truncate cursor-pointer hover:text-[#aa151b] transition-colors duration-150 min-w-0 flex-1"
        >
          {store.name}
        </a>

        <div className="flex items-center gap-3 shrink-0">
          {store.distanceKm != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[10px] font-black text-neutral-500 dark:text-neutral-400 tabular-nums">
              <Navigation className="w-3 h-3 text-[#aa151b]" />
              {store.distanceKm}km
            </span>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#aa151b]" />
            <span className={`text-sm font-black tabular-nums whitespace-nowrap ${waitColorClass}`}>
              {displayStatus.waitText}
            </span>
          </div>

         <div className="flex items-center gap-1">
             <Users className="w-3 h-3 text-sky-500" />
             <span className="text-sm font-black text-neutral-900 dark:text-white tabular-nums whitespace-nowrap">
                {displayStatus.groupText}
              </span>
           </div>
        </div>
      </div>

      {/* Row 2: Actions — maps, refresh, bookmark, compare, details */}
      <div className="flex items-center gap-1 px-3 py-1.5 ml-1 border-t border-neutral-100 dark:border-neutral-800">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-neutral-400 hover:text-[#aa151b] transition-colors duration-150 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 shrink-0"
          title="Google 地圖"
        >
          <MapPin className="w-3.5 h-3.5" />
        </a>

        <button
          onClick={() => onRefreshQueue(store.id, store.name)}
          disabled={queueLoading}
          className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150 cursor-pointer disabled:opacity-50"
          title="更新叫號"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${queueLoading ? 'animate-spin text-[#aa151b]' : ''}`} />
        </button>

        <button
          onClick={() => onToggleBookmark(store)}
          className={`p-1.5 rounded-md transition-all duration-150 cursor-pointer ${
            isBookmarked
              ? 'text-[#aa151b] bg-red-50 dark:bg-red-950/40'
              : 'text-neutral-500 hover:text-[#aa151b] hover:bg-red-50 dark:hover:bg-red-950/40'
          }`}
          title={isBookmarked ? '取消關注' : '加入關注'}
        >
          <Heart className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#aa151b]' : ''}`} />
        </button>

        <button
          onClick={() => onToggleCompare(store)}
          className={`p-1.5 rounded-md transition-all duration-150 cursor-pointer ${
            isComparing
              ? 'text-[#141414] dark:text-white bg-neutral-100 dark:bg-neutral-800'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title={isComparing ? '取消比較' : '加入比較'}
        >
          {isComparing ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </button>

        <div className="flex-1" />

        <a
          href={`/store/${store.id}`}
          onClick={(e) => { e.preventDefault(); onSelectStore(store, 'live'); }}
          className="flex items-center gap-0.5 px-2.5 py-1 bg-[#aa151b] hover:bg-[#8e171d] active:scale-[0.97] text-white text-[10px] font-black uppercase transition-all duration-150 cursor-pointer rounded"
        >
          <span>詳情</span>
          <ChevronRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
