import React from 'react';
import { SushiroStore, StoreQueueMap } from '../types';
import { X, Clock, Users, Trash2, RefreshCw, Zap, ExternalLink, Layers, Sparkles } from 'lucide-react';
import { getStoreStatusInfo, getTicketStatusInfo } from '../utils/status';

interface CompareDrawerProps {
  isOpen: boolean;
  stores: SushiroStore[];
  queues: StoreQueueMap;
  onClose: () => void;
  onRemoveFromCompare: (storeId: number) => void;
  onClearCompare: () => void;
  onRefreshQueue: (storeId: number, name: string) => void;
  onSelectStore?: (store: SushiroStore) => void;
  onAddDefaultStores?: () => void;
}

export const CompareDrawer: React.FC<CompareDrawerProps> = ({
  isOpen,
  stores,
  queues,
  onClose,
  onRemoveFromCompare,
  onClearCompare,
  onRefreshQueue,
  onSelectStore,
  onAddDefaultStores,
}) => {
  if (!isOpen) return null;

  // Find min wait and min waiting groups for open stores
  const openStores = stores.filter((s) => s.storeStatus === 'OPEN');
  const minWait = openStores.length > 1 ? Math.min(...openStores.map((s) => s.wait)) : null;
  const minGroup = openStores.length > 1 ? Math.min(...openStores.map((s) => s.waitingGroup)) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-5xl bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#141414] text-white flex items-center justify-between border-b-4 border-[#E21F26] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E21F26] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                <span>門市即時對比</span>
                <span className="px-2.5 py-0.5 bg-[#E21F26] text-white text-[11px] font-black rounded-full uppercase">
                  {stores.length} / 4
                </span>
              </h2>
              <p className="text-xs font-medium text-neutral-400 mt-0.5">
                橫向比較等候時間、輪候組數與現場最新叫號
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {stores.length > 0 && (
              <button
                onClick={onClearCompare}
                className="text-xs font-black uppercase text-neutral-300 hover:text-white flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-[#E21F26] rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">清空列表</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-neutral-800 hover:bg-[#E21F26] text-white transition-colors cursor-pointer"
              title="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto overflow-x-auto flex-1">
          {stores.length === 0 ? (
            <div className="text-center py-12 px-4 text-neutral-500 font-medium my-auto">
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto mb-4 border border-neutral-200 dark:border-neutral-700">
                <Layers className="w-8 h-8" />
              </div>
              <p className="text-lg font-black text-neutral-900 dark:text-neutral-100">尚未選擇比較門市</p>
              <p className="text-xs mt-1.5 text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                請在全港門市列表中，點擊門市卡片上的「+ 比對」按鈕加入分店進行多店即時比較（最多 4 間）。
              </p>
              {onAddDefaultStores && (
                <button
                  onClick={onAddDefaultStores}
                  className="mt-5 px-5 py-2 rounded-full bg-[#E21F26] text-white font-black text-xs uppercase tracking-wider transition-all hover:bg-red-700 cursor-pointer shadow-sm inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>自動載入熱門門市比對</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stores.map((store) => {
                const storeStatusInfo = getStoreStatusInfo(store.storeStatus);
                const ticketStatusInfo = getTicketStatusInfo(store.netTicketStatus, store.storeStatus);
                const qData = queues[store.id];
                const q = qData?.queue;

                const booth = q?.boothQueue?.[0] || q?.storeBoothQueue?.[0];
                const counter = q?.counterQueue?.[0] || q?.storeCounterQueue?.[0];

                const isFastest = minWait !== null && store.storeStatus === 'OPEN' && store.wait === minWait;
                const isLeastGroups = minGroup !== null && store.storeStatus === 'OPEN' && store.waitingGroup === minGroup;

                return (
                  <div
                    key={`compare-${store.id}`}
                    className={`bg-white dark:bg-neutral-800/80 p-4 rounded-xl border-2 transition-all flex flex-col justify-between relative shadow-xs ${
                      isFastest
                        ? 'border-emerald-500/80 ring-2 ring-emerald-500/20'
                        : 'border-neutral-200 dark:border-neutral-700/80'
                    }`}
                  >
                    {/* Top Badges */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-[#E21F26] uppercase tracking-wider bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-md border border-red-200/60 dark:border-red-900/60">
                        {store.area || '香港'}
                      </span>
                      <button
                        onClick={() => onRemoveFromCompare(store.id)}
                        className="p-1 rounded-full text-neutral-400 hover:text-[#E21F26] hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                        title="移除此門市"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      {/* Highlight Badges */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {isFastest && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
                            <Zap className="w-3 h-3" />
                            <span>最快開枱</span>
                          </span>
                        )}
                        {isLeastGroups && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black bg-sky-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
                            <Users className="w-3 h-3" />
                            <span>最少組數</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-lg text-neutral-900 dark:text-white truncate mb-3">
                        {store.name}
                      </h3>

                      {/* Stat Tiles */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between text-xs bg-neutral-50 dark:bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-200/80 dark:border-neutral-700/60">
                          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#E21F26]" />
                            <span>預計等候</span>
                          </span>
                          <span className="font-black text-[#E21F26] text-base tabular-nums">
                            {store.storeStatus === 'OPEN' ? `${store.wait} MINS` : '休息中'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs bg-neutral-50 dark:bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-200/80 dark:border-neutral-700/60">
                          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-sky-500" />
                            <span>輪候組數</span>
                          </span>
                          <span className="font-black text-neutral-900 dark:text-white text-base tabular-nums">
                            {store.storeStatus === 'OPEN' ? `${store.waitingGroup} 組` : '--'}
                          </span>
                        </div>
                      </div>

                      {/* Live Ticket calling */}
                      <div className="bg-neutral-50 dark:bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-200/80 dark:border-neutral-700/60 text-xs mb-3">
                        <div className="flex items-center justify-between mb-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                          <span>即時叫號</span>
                          <button
                            onClick={() => onRefreshQueue(store.id, store.name)}
                            className="text-[#E21F26] hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${qData?.loading ? 'animate-spin' : ''}`} />
                            <span>更新</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-center font-mono">
                          <div className="bg-white dark:bg-neutral-800 p-1.5 rounded border border-neutral-200/60 dark:border-neutral-700/60">
                            <div className="text-[9px] font-sans font-bold text-neutral-400 uppercase">桌席</div>
                            <div className="font-black text-[#E21F26] text-sm tabular-nums">
                              {booth ? `#${booth}` : '-'}
                            </div>
                          </div>
                          <div className="bg-white dark:bg-neutral-800 p-1.5 rounded border border-neutral-200/60 dark:border-neutral-700/60">
                            <div className="text-[9px] font-sans font-bold text-neutral-400 uppercase">吧台</div>
                            <div className="font-black text-neutral-900 dark:text-white text-sm tabular-nums">
                              {counter ? `#${counter}` : '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2.5 border-t border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${storeStatusInfo.bgColor} ${storeStatusInfo.textColor}`}>
                          {storeStatusInfo.label}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${ticketStatusInfo.bgColor} ${ticketStatusInfo.textColor}`}>
                          {ticketStatusInfo.label}
                        </span>
                      </div>

                      {onSelectStore && (
                        <button
                          onClick={() => {
                            onClose();
                            onSelectStore(store);
                          }}
                          className="px-2.5 py-1 bg-[#141414] hover:bg-[#E21F26] text-white text-[11px] font-black rounded-md transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <span>詳情</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

