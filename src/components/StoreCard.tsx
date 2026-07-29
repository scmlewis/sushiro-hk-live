import React from 'react';
import { SushiroStore, GroupQueue } from '../types';
import { getStoreStatusInfo, getTicketStatusInfo, formatGoogleMapsUrl, getStoreDisplayStatus } from '../utils/status';
import { Heart, MapPin, RefreshCw, ChevronRight, Plus, Check } from 'lucide-react';

interface StoreCardProps {
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

export const StoreCard: React.FC<StoreCardProps> = ({
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
  const ticketStatusInfo = getTicketStatusInfo(store.netTicketStatus, store.storeStatus, store.localTicketingStatus, store.wait, store.waitingGroup);
  const mapsUrl = formatGoogleMapsUrl(store.latitude, store.longitude, store.address, store.name);

  const displayStatus = getStoreDisplayStatus(store);

  const borderMap: Record<string, string> = {
    emerald: 'border-l-8 border-emerald-500',
    amber: 'border-l-8 border-amber-500',
    violet: 'border-l-8 border-violet-500',
    orange: 'border-l-8 border-orange-500',
    red: 'border-l-8 border-[#aa151b]',
    neutral: 'border-l-8 border-neutral-300 dark:border-l-8 dark:border-neutral-700',
  };
  const borderLeftColor = borderMap[displayStatus.accentColor] || borderMap.neutral;

  const textMap: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    violet: 'text-violet-600 dark:text-violet-400',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-[#aa151b]',
    neutral: 'text-neutral-400',
  };
  const waitTextColor = displayStatus.waitText === '停飛'
    ? 'text-rose-600 dark:text-rose-400'
    : textMap[displayStatus.accentColor] || 'text-[#141414] dark:text-white';

  // Helper to extract top / current queue numbers
  const getQueueSummary = () => {
    if (!queue) return null;
    const booth = queue.boothQueue?.[0] || queue.storeBoothQueue?.[0];
    const counter = queue.counterQueue?.[0] || queue.storeCounterQueue?.[0];
    const storeQ = queue.storeQueue?.[0] || queue.mixedQueue?.[0];

    const hasAny = booth || counter || storeQ;
    if (!hasAny) return null;

    return { booth, counter, storeQ };
  };

  const queueSummary = getQueueSummary();

  return (
    <div
      className={`group relative bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-md hover:shadow-2xl transition-all duration-200 flex flex-col justify-between overflow-hidden border border-neutral-200 dark:border-neutral-800 ${borderLeftColor}`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                {store.area}
              </span>
              {store.distanceKm !== undefined && store.distanceKm !== Infinity && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  📍 {store.distanceKm} KM
                </span>
              )}
            </div>

            <h3
              onClick={() => onSelectStore(store)}
              className="text-2xl sm:text-3xl font-black tracking-tight text-[#141414] dark:text-white truncate cursor-pointer hover:text-[#aa151b] transition-colors"
            >
              {store.name}
            </h3>
            {store.nameEn && (
              <p className="text-xs font-semibold text-neutral-400 truncate mt-0.5">{store.nameEn}</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleCompare(store)}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                isComparing
                  ? 'bg-[#aa151b] text-white'
                  : 'text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title={isComparing ? '已加入比對' : '加入比對'}
            >
              {isComparing ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>

            <button
              onClick={() => onToggleBookmark(store)}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                isBookmarked
                  ? 'bg-[#aa151b] text-white'
                  : 'text-neutral-400 hover:text-[#aa151b] hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title={isBookmarked ? '取消關注' : '關注門市'}
            >
              <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-white' : ''}`} />
            </button>
          </div>
        </div>

        {/* Address */}
        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mb-4 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span>{store.address}</span>
        </p>

        {/* Status Badges */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-wider border ${storeStatusInfo.bgColor} ${storeStatusInfo.textColor} ${storeStatusInfo.borderColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${storeStatusInfo.dotColor}`} />
            {storeStatusInfo.label}
          </span>

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-wider border ${ticketStatusInfo.bgColor} ${ticketStatusInfo.textColor} ${ticketStatusInfo.borderColor}`}>
            {ticketStatusInfo.label}
          </span>
        </div>

        {/* Wait Time Giant Typography Display */}
        <div className="mb-6 border-y border-neutral-100 dark:border-neutral-800/80 py-4">
          <div className="flex items-baseline justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">
                預估等候時間
              </span>
              <div className="flex items-baseline gap-1">
                {displayStatus.isClosed ? (
                  <span className={`text-3xl font-black ${waitTextColor}`}>
                    {displayStatus.waitText}
                  </span>
                ) : (
                  <>
                    <span className={`text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter tabular-nums leading-none ${waitTextColor}`}>
                      {store.wait}
                    </span>
                    <span className="text-lg sm:text-xl font-black opacity-40 uppercase">分鐘</span>
                  </>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 block">
                輪候組數
              </span>
              <span className="text-3xl font-black text-[#141414] dark:text-white tabular-nums">
                {displayStatus.groupText}
              </span>
            </div>
          </div>
        </div>

        {/* Live Calling Preview */}
        {(isBookmarked || queue) && (
          <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                當前叫號進度
              </span>
              <button
                onClick={() => onRefreshQueue(store.id, store.name)}
                disabled={queueLoading}
                className="text-[#aa151b] font-bold text-[11px] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${queueLoading ? 'animate-spin' : ''}`} />
                <span>更新</span>
              </button>
            </div>

            {queueSummary ? (
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                {queueSummary.booth && (
                  <div className="bg-white dark:bg-neutral-900 p-2 rounded border border-neutral-200 dark:border-neutral-700">
                    <div className="text-[9px] font-bold text-neutral-400 uppercase">桌席 (B)</div>
                    <div className="font-black text-[#aa151b] text-base tabular-nums">#{queueSummary.booth}</div>
                  </div>
                )}
                {queueSummary.counter && (
                  <div className="bg-white dark:bg-neutral-900 p-2 rounded border border-neutral-200 dark:border-neutral-700">
                    <div className="text-[9px] font-bold text-neutral-400 uppercase">吧台 (C)</div>
                    <div className="font-black text-neutral-900 dark:text-white text-base tabular-nums">#{queueSummary.counter}</div>
                  </div>
                )}
                {queueSummary.storeQ && (
                  <div className="bg-white dark:bg-neutral-900 p-2 rounded border border-neutral-200 dark:border-neutral-700">
                    <div className="text-[9px] font-bold text-neutral-400 uppercase">現場/混合</div>
                    <div className="font-black text-neutral-800 dark:text-neutral-200 text-base tabular-nums">#{queueSummary.storeQ}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-neutral-400 font-bold py-1 text-xs">
                {store.storeStatus === 'OPEN' ? '暫無現場叫號資訊' : '門市已休息'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer link & Details trigger */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs gap-1.5 flex-wrap">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-500 hover:text-[#aa151b] font-bold text-xs transition-colors flex items-center gap-1 mr-auto shrink-0"
        >
          <MapPin className="w-3.5 h-3.5 text-[#aa151b]" />
          <span>地圖指引</span>
        </a>

        <button
          onClick={() => onSelectStore(store, 'live')}
          className="font-black text-white bg-[#aa151b] hover:bg-red-700 px-3 py-1 rounded-full flex items-center gap-1 cursor-pointer text-xs transition-colors shadow-xs shrink-0"
        >
          <span>詳情</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

