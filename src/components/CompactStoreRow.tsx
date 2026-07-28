import React from 'react';
import { SushiroStore, GroupQueue } from '../types';
import { getStoreStatusInfo, getTicketStatusInfo, formatGoogleMapsUrl } from '../utils/status';
import { Heart, MapPin, RefreshCw, ChevronRight, Plus, Check, Ticket, Clock, Users } from 'lucide-react';

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
  const storeStatusInfo = getStoreStatusInfo(store.storeStatus);
  const ticketStatusInfo = getTicketStatusInfo(store.netTicketStatus, store.storeStatus);
  const mapsUrl = formatGoogleMapsUrl(store.latitude, store.longitude, store.address, store.name);

  // Status color bar indicator
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

  // Quick live queue number snippet
  const boothNum = queue?.boothQueue?.[0] || queue?.storeBoothQueue?.[0];
  const counterNum = queue?.counterQueue?.[0] || queue?.storeCounterQueue?.[0];

  return (
    <div className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-2.5 sm:p-3 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 overflow-hidden">
      {/* Left Accent Bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColorClass}`} />

      {/* Main Info (Left) */}
      <div className="flex-1 min-w-0 pl-2">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-black text-[9px] uppercase tracking-wider">
            {store.area}
          </span>

          <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border ${storeStatusInfo.bgColor} ${storeStatusInfo.textColor} ${storeStatusInfo.borderColor}`}>
            {storeStatusInfo.label}
          </span>

          <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border ${ticketStatusInfo.bgColor} ${ticketStatusInfo.textColor} ${ticketStatusInfo.borderColor}`}>
            {ticketStatusInfo.label}
          </span>

          {store.distanceKm !== undefined && store.distanceKm !== Infinity && (
            <span className="text-[10px] font-black text-sky-600 dark:text-sky-400">
              📍 {store.distanceKm} KM
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <h4
            onClick={() => onSelectStore(store)}
            className="text-sm sm:text-base font-black text-neutral-900 dark:text-white truncate cursor-pointer hover:text-[#E21F26] transition-colors"
          >
            {store.name}
          </h4>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-neutral-400 hover:text-[#E21F26] transition-colors p-0.5"
            title="Google 地圖"
          >
            <MapPin className="w-3.5 h-3.5" />
          </a>
        </div>
        {store.nameEn && (
          <p className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 truncate">{store.nameEn}</p>
        )}

        {/* Live Calling numbers mini chip */}
        {(boothNum || counterNum) && (
          <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono font-bold text-neutral-500 dark:text-neutral-400">
            {boothNum && (
              <span className="flex items-center gap-1">
                <Ticket className="w-3 h-3 text-[#E21F26]" />
                <span className="font-sans text-[10px] uppercase">桌席</span>
                <span className="text-[#E21F26]">#{boothNum}</span>
              </span>
            )}
            {counterNum && (
              <span className="flex items-center gap-1">
                <span className="font-sans text-[10px] uppercase">吧台</span>
                <span className="text-neutral-800 dark:text-neutral-200">#{counterNum}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Center/Right: Wait Time, Group Stats & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 w-full sm:w-auto border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800/80 pt-2 sm:pt-0">
        {/* Wait Time & Group Stats */}
        <div className="flex items-center justify-between sm:justify-start gap-4 text-left sm:text-right">
          <div className="flex items-center gap-3 sm:gap-4">
            <div>
              <div className="text-[9px] font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
                <Clock className="w-3 h-3 text-[#E21F26]" />
                <span>預計等候</span>
              </div>
              <div className={`text-sm sm:text-lg font-black tabular-nums whitespace-nowrap ${waitColorClass}`}>
                {store.storeStatus === 'OPEN' ? `${store.wait} 分鐘` : '休息中'}
              </div>
            </div>

            <div className="h-7 w-px bg-neutral-200 dark:bg-neutral-800 shrink-0" />

            <div>
              <div className="text-[9px] font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
                <Users className="w-3 h-3 text-sky-500" />
                <span>輪候組數</span>
              </div>
              <div className="text-sm sm:text-lg font-black text-neutral-900 dark:text-white tabular-nums whitespace-nowrap">
                {store.storeStatus === 'OPEN' ? `${store.waitingGroup} 組` : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100/80 dark:border-neutral-800/80">
          {/* Quick Tool Control Group */}
          <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-lg border border-neutral-200/80 dark:border-neutral-700/60">
            <button
              onClick={() => onRefreshQueue(store.id, store.name)}
              disabled={queueLoading}
              className="p-1.5 rounded-md text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-700 transition-all cursor-pointer flex items-center justify-center min-w-[32px] min-h-[32px]"
              title="更新即時叫號"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${queueLoading ? 'animate-spin text-[#E21F26]' : ''}`} />
            </button>

            <div className="h-3.5 w-px bg-neutral-200 dark:bg-neutral-700/80 my-auto" />

            <button
              onClick={() => onToggleBookmark(store)}
              className={`p-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center min-w-[32px] min-h-[32px] ${
                isBookmarked
                  ? 'bg-[#E21F26] text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-[#E21F26] dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700'
              }`}
              title={isBookmarked ? '已加入關注' : '加入關注'}
            >
              <Heart className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white' : ''}`} />
            </button>

            <div className="h-3.5 w-px bg-neutral-200 dark:bg-neutral-700/80 my-auto" />

            <button
              onClick={() => onToggleCompare(store)}
              className={`p-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center min-w-[32px] min-h-[32px] ${
                isComparing
                  ? 'bg-[#141414] text-white dark:bg-white dark:text-[#141414] shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-700'
              }`}
              title={isComparing ? '已加入比對' : '加入門市比對'}
            >
              {isComparing ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Primary CTA */}
          <button
            onClick={() => onSelectStore(store, 'live')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E21F26] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer rounded-lg shadow-2xs"
          >
            <span>詳情</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
