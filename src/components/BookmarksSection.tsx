import React from 'react';
import { SushiroStore, StoreQueueMap } from '../types';
import { CompactStoreRow } from './CompactStoreRow';
import { Heart, Sparkles, Layers, Trash2 } from 'lucide-react';

interface BookmarksSectionProps {
  bookmarkedStores: SushiroStore[];
  queues: StoreQueueMap;
  compareList: number[];
  autoRefreshTimer: number; // seconds remaining until next 10s auto-refresh
  onToggleBookmark: (store: SushiroStore) => void;
  onToggleCompare: (store: SushiroStore) => void;
  onRefreshQueue: (storeId: number, storeName: string) => void;
  onSelectStore: (store: SushiroStore) => void;
  onGoToAllStores?: () => void;
  onCompareAllBookmarks?: () => void;
  onClearAllBookmarks?: () => void;
}

export const BookmarksSection: React.FC<BookmarksSectionProps> = ({
  bookmarkedStores,
  queues,
  compareList,
  autoRefreshTimer,
  onToggleBookmark,
  onToggleCompare,
  onRefreshQueue,
  onSelectStore,
  onGoToAllStores,
  onCompareAllBookmarks,
  onClearAllBookmarks,
}) => {
  if (bookmarkedStores.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 p-8 sm:p-12 text-center my-6 rounded-2xl shadow-lg max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/60 text-[#E21F26] flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-800">
          <Heart className="w-8 h-8 fill-current" />
        </div>
        <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
          尚未關注任何門市
        </h3>
        <p className="text-xs sm:text-sm font-bold text-neutral-500 dark:text-neutral-400 mt-2 max-w-md mx-auto leading-relaxed">
          在全港門市列表中，點擊門市卡片上的 ♥ 即可加入「我的關注」，獲得每 10 秒自動連線排隊更新與置頂追蹤。
        </p>
        {onGoToAllStores && (
          <button
            onClick={onGoToAllStores}
            className="mt-6 px-6 py-2.5 rounded-full bg-[#E21F26] text-white font-black text-xs uppercase tracking-wider transition-all hover:bg-red-700 cursor-pointer shadow-md inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>瀏覽全港門市列表</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <section id="bookmarks-section" className="mb-8">
      <div className="bg-[#141414] text-white p-4 sm:p-6 shadow-xl border-l-4 border-[#E21F26] rounded-2xl relative overflow-hidden">
        {/* Streamlined Live Auto-Poll Status Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E21F26] text-white flex items-center justify-center shadow-md shrink-0">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white">我的關注門市</span>
                <span className="px-2.5 py-0.5 bg-[#E21F26] text-white text-[11px] font-black rounded-full">
                  {bookmarkedStores.length} 間
                </span>
              </div>
              <p className="text-xs font-medium text-neutral-400 mt-0.5">
                每 10 秒即時自動更新現場排隊與組數
              </p>
            </div>
          </div>

          {/* Controls & Live Status */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Auto Refresh Live Status Pill */}
            <div className="flex items-center gap-2.5 bg-neutral-800/90 px-3.5 py-1.5 rounded-xl border border-neutral-700/80 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[11px] font-black text-neutral-200 uppercase tracking-wider">
                自動輪詢: <span className="text-[#E21F26] font-mono font-black">{autoRefreshTimer}S</span>
              </span>
              <div className="w-10 bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#E21F26] h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(autoRefreshTimer / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* Batch Actions */}
            {onCompareAllBookmarks && bookmarkedStores.length > 1 && (
              <button
                onClick={onCompareAllBookmarks}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-[#E21F26] text-white text-xs font-black rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border border-neutral-700/80"
                title="將全部關注門市加入比較"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>比對關注</span>
              </button>
            )}

            {onClearAllBookmarks && (
              <button
                onClick={onClearAllBookmarks}
                className="px-3 py-1.5 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-black rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border border-neutral-700/80"
                title="清空所有關注"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">清空關注</span>
              </button>
            )}
          </div>
        </div>

        {/* Bookmarked List Layout */}
        <div className="flex flex-col space-y-2.5">
          {bookmarkedStores.map((store) => {
            const queueData = queues[store.id];
            return (
              <CompactStoreRow
                key={`bookmark-${store.id}`}
                store={store}
                queue={queueData?.queue}
                queueLoading={queueData?.loading}
                isBookmarked={true}
                isComparing={compareList.includes(store.id)}
                onToggleBookmark={onToggleBookmark}
                onToggleCompare={onToggleCompare}
                onRefreshQueue={onRefreshQueue}
                onSelectStore={onSelectStore}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

