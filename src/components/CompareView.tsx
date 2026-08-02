import React from 'react';
import { SushiroStore, StoreQueueMap } from '../types';
import { Layers, Clock, Users, Trash2, RefreshCw, Zap, ExternalLink, Sparkles } from 'lucide-react';
import { getStoreStatusInfo, getTicketStatusInfo, getStoreDisplayStatus, getQueueTicketCount, isStoreEffectivelyOpen } from '../utils/status';

interface CompareViewProps {
  stores: SushiroStore[];
  queues: StoreQueueMap;
  onRemoveFromCompare: (storeId: number) => void;
  onClearCompare: () => void;
  onRefreshQueue: (storeId: number, name: string) => void;
  onSelectStore?: (store: SushiroStore) => void;
  onAddDefaultStores?: () => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  stores,
  queues,
  onRemoveFromCompare,
  onClearCompare,
  onRefreshQueue,
  onSelectStore,
  onAddDefaultStores,
}) => {
  const openStores = stores.filter((s) => s.storeStatus === 'OPEN');
   const minWait = openStores.length > 1 ? Math.min(...openStores.map((s) => s.wait)) : null;
   const minTickets = openStores.length > 1 ? Math.min(...openStores.map((s) => getQueueTicketCount(queues[s.id]?.queue || null))) : null;

  const sortedStores = [...stores].sort((a, b) => {
    if (a.storeStatus === 'OPEN' && b.storeStatus !== 'OPEN') return -1;
    if (a.storeStatus !== 'OPEN' && b.storeStatus === 'OPEN') return 1;
    if (a.storeStatus === 'OPEN' && b.storeStatus === 'OPEN') {
      if (minWait !== null && a.wait === minWait) return -1;
      if (minWait !== null && b.wait === minWait) return 1;
      return a.wait - b.wait;
    }
    return 0;
  });

  if (stores.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 p-8 sm:p-12 text-center my-6 rounded-2xl shadow-lg max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto mb-4 border border-neutral-200 dark:border-neutral-700">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
          尚未選擇比較門市
        </h3>
        <p className="text-xs sm:text-sm font-bold text-neutral-500 dark:text-neutral-400 mt-2 max-w-md mx-auto leading-relaxed">
          在全港門市列表中，點擊門市操作欄的「+」按鈕加入門市進行多店即時比較（最多 4 間）。
        </p>
        {onAddDefaultStores && (
          <button
            onClick={onAddDefaultStores}
            className="mt-6 px-6 py-2.5 rounded-full bg-[#aa151b] text-white font-black text-xs uppercase tracking-wider transition-all hover:bg-red-700 cursor-pointer shadow-md inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>自動載入熱門門市比較</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#aa151b]" />
          <span className="text-sm font-black text-neutral-900 dark:text-white">
            門市即時比對
          </span>
          <span className="px-2 py-0.5 bg-[#aa151b] text-white text-[10px] font-black rounded-full">
            {stores.length} / 4
          </span>
        </div>
        <button
          onClick={onClearCompare}
          className="text-xs font-black text-neutral-500 hover:text-[#aa151b] flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>清空</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedStores.map((store) => {
          const displayStatus = getStoreDisplayStatus(store);
          const storeStatusInfo = getStoreStatusInfo(store.storeStatus, isStoreEffectivelyOpen(store));
          const ticketStatusInfo = getTicketStatusInfo(store.netTicketStatus, store.storeStatus, store.localTicketingStatus, store.wait, store.waitingGroup, isStoreEffectivelyOpen(store));
          const qData = queues[store.id];
          const q = qData?.queue;
          const boothQueue = q?.boothQueue || q?.storeBoothQueue || [];
          const counterQueue = q?.counterQueue || q?.storeCounterQueue || [];
          const booth = boothQueue.length > 0 ? boothQueue[boothQueue.length - 1] : undefined;
          const counter = counterQueue.length > 0 ? counterQueue[counterQueue.length - 1] : undefined;
          const isFastest = minWait !== null && store.storeStatus === 'OPEN' && store.wait === minWait;
          const isLeastTickets = minTickets !== null && store.storeStatus === 'OPEN' && getQueueTicketCount(q) === minTickets;

          return (
            <div
              key={`compare-${store.id}`}
              className={`bg-white dark:bg-neutral-800/80 p-4 rounded-xl border-2 transition-all flex flex-col justify-between relative shadow-xs ${
                isFastest ? 'border-emerald-500/80 ring-2 ring-emerald-500/20' : 'border-neutral-200 dark:border-neutral-700/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-1">
                    {isFastest && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                        <Zap className="w-3 h-3" />最快可入座
                      </span>
                    )}
                    {isLeastTickets && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-black bg-sky-500 text-white px-2 py-0.5 rounded-full">
                        <Users className="w-3 h-3" />最少票數
                      </span>
                    )}
                  </div>
                  <button onClick={() => onRemoveFromCompare(store.id)} className="p-1 rounded-full text-neutral-400 hover:text-[#aa151b] transition-colors" title="移除此門市">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="font-black text-base text-neutral-900 dark:text-white truncate mb-3">{store.name}</h3>

                <div className="flex items-center justify-between text-xs bg-neutral-50 dark:bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-200/80 dark:border-neutral-700/60 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-neutral-400 uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#aa151b]" />等候
                    </span>
                    <span className="font-black text-[#aa151b] text-sm tabular-nums">
                      {displayStatus.isClosed ? displayStatus.waitText : `${store.wait} 分鐘`}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-neutral-400 uppercase flex items-center gap-1">
                       <Users className="w-3 h-3 text-sky-500" />票數
                    </span>
                    <span className="font-black text-neutral-900 dark:text-white text-sm tabular-nums">
                       {displayStatus.isClosed ? '--' : `${getQueueTicketCount(q)} 組`}
                    </span>
                  </div>
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-900/80 p-2 rounded-lg border border-neutral-200/80 dark:border-neutral-700/60 text-xs mb-3">
                  <div className="flex items-center justify-between mb-1 text-[10px] font-black uppercase text-neutral-400">
                    <span>即時叫號</span>
                    <button onClick={() => onRefreshQueue(store.id, store.name)} className="text-[#aa151b] hover:underline flex items-center gap-0.5 cursor-pointer">
                      <RefreshCw className={`w-3 h-3 ${qData?.loading ? 'animate-spin' : ''}`} />更新
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-center font-mono">
                    <div className="bg-white dark:bg-neutral-800 p-1 rounded border border-neutral-200/60 dark:border-neutral-700/60">
                      <div className="text-[9px] font-sans font-bold text-neutral-400 uppercase">桌席</div>
                      <div className="font-black text-[#aa151b] text-xs tabular-nums">{booth ? `#${booth}` : '-'}</div>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 p-1 rounded border border-neutral-200/60 dark:border-neutral-700/60">
                      <div className="text-[9px] font-sans font-bold text-neutral-400 uppercase">吧台</div>
                      <div className="font-black text-neutral-900 dark:text-white text-xs tabular-nums">{counter ? `#${counter}` : '-'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded ${storeStatusInfo.bgColor} ${storeStatusInfo.textColor}`}>{storeStatusInfo.label}</span>
                  <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded ${ticketStatusInfo.bgColor} ${ticketStatusInfo.textColor}`}>{ticketStatusInfo.label}</span>
                </div>
                {onSelectStore && (
                  <button onClick={() => onSelectStore(store)} className="px-2 py-0.5 bg-[#141414] hover:bg-[#aa151b] text-white text-[10px] font-black rounded transition-colors cursor-pointer flex items-center gap-0.5 shrink-0">
                    <span>詳情</span><ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
