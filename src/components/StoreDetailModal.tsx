import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SushiroStore, GroupQueue } from '../types';
import { getStoreStatusInfo, getTicketStatusInfo, formatGoogleMapsUrl, isStoreServicing, getStoreDisplayStatus } from '../utils/status';
import { X, RefreshCw, Heart, MapPin, ExternalLink, Info, Calculator } from 'lucide-react';

interface StoreDetailModalProps {
  store: SushiroStore | null;
  queue: GroupQueue | null;
  loading: boolean;
  isBookmarked: boolean;
  onClose: () => void;
  onRefreshQueue: (storeId: number, storeName: string) => void;
  onToggleBookmark: (store: SushiroStore) => void;
}

export const StoreDetailModal: React.FC<StoreDetailModalProps> = ({
  store,
  queue,
  loading,
  isBookmarked,
  onClose,
  onRefreshQueue,
  onToggleBookmark,
}) => {
  const [myTicket, setMyTicket] = useState<string>('');

  useEffect(() => {
    setMyTicket('');
  }, [store?.id]);

  const handleNumpad = (key: string) => {
    if (key === 'del') {
      setMyTicket((prev) => prev.slice(0, -1));
    } else if (key === 'clear') {
      setMyTicket('');
    } else {
      if (myTicket === '0') {
        setMyTicket(key);
      } else if (myTicket.length < 4) {
        setMyTicket((prev) => prev + key);
      }
    }
  };

  const handleQuickPreset = (preset: 'called' | 'next10' | 'next25') => {
    if (preset === 'called') {
      setMyTicket(String(minCalledNum));
    } else if (preset === 'next10') {
      setMyTicket(String(minCalledNum + 10));
    } else if (preset === 'next25') {
      setMyTicket(String(minCalledNum + 25));
    }
  };

  if (!store) return null;

  const storeStatusInfo = getStoreStatusInfo(store.storeStatus);
  const ticketStatusInfo = getTicketStatusInfo(store.netTicketStatus, store.storeStatus, store.localTicketingStatus, store.wait, store.waitingGroup);
  const mapsUrl = formatGoogleMapsUrl(store.latitude, store.longitude, store.address, store.name);

  const boothNumbers = queue?.boothQueue || queue?.storeBoothQueue || [];
  const counterNumbers = queue?.counterQueue || queue?.storeCounterQueue || [];
  const storeNumbers = queue?.storeQueue || queue?.mixedQueue || [];

  const allCurrentNums = [...boothNumbers, ...counterNumbers, ...storeNumbers]
    .map((n) => parseInt(n.replace(/\D/g, ''), 10))
    .filter((n) => !isNaN(n));

  const minCalledNum = allCurrentNums.length > 0 ? Math.min(...allCurrentNums) : 0;
  const hasNoQueue = allCurrentNums.length === 0;

  const isServicing = isStoreServicing(store);

  // 3 most recent called numbers across all categories
  const recentNumbers = allCurrentNums
    .sort((a, b) => a - b)
    .slice(-3)
    .reverse();

  const myTicketNum = parseInt(myTicket, 10);
  let groupsAhead = 0;
  let estimatedMins = 0;
  let ticketValidationState: 'empty' | 'called' | 'valid' | 'far_future' = 'empty';
  let validationMessage = '';

  if (!isServicing) {
    ticketValidationState = 'empty';
    validationMessage = '門市目前已收工，籌號計算器暫停使用';
  } else if (hasNoQueue) {
    if (!myTicket || isNaN(myTicketNum) || myTicketNum <= 0) {
      ticketValidationState = 'empty';
      validationMessage = '目前無輪候，請輸入籌號或直入';
    } else {
      ticketValidationState = 'valid';
      groupsAhead = 0;
      estimatedMins = 0;
      validationMessage = '目前無輪候，可直入就餐';
    }
  } else if (!myTicket || isNaN(myTicketNum) || myTicketNum <= 0) {
    ticketValidationState = 'empty';
    validationMessage = '請使用下方數字鍵盤輸入您手中的籌號';
  } else if (myTicketNum <= minCalledNum) {
    ticketValidationState = 'called';
    groupsAhead = 0;
    estimatedMins = 0;
    validationMessage = `籌號 #${myTicketNum} 已於較早前叫號完畢，如錯過叫號請至門市櫃檯登記過期補號。`;
  } else if (myTicketNum - minCalledNum > 350) {
    ticketValidationState = 'far_future';
    groupsAhead = myTicketNum - minCalledNum;
    estimatedMins = Math.round(groupsAhead * 1.3);
    validationMessage = `籌號 #${myTicketNum} 距離目前最新叫號 (#${minCalledNum}) 相差較遠 (${groupsAhead} 組)，請核對籌號是否正確。`;
  } else {
    ticketValidationState = 'valid';
    groupsAhead = myTicketNum - minCalledNum;
    estimatedMins = Math.max(2, Math.round(groupsAhead * 1.35));
    validationMessage = `正常輪候中：前面尚有 ${groupsAhead} 組，預估等待時間約 ${estimatedMins} 分鐘。`;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden border-2 border-neutral-800 rounded-2xl my-auto"
      >
        {/* Fixed Header */}
        <div className="shrink-0 p-4 sm:p-6 bg-[#141414] text-white relative border-b-4 border-[#E21F26]">
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={() => onToggleBookmark(store)}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                isBookmarked
                  ? 'bg-[#E21F26] text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:text-[#E21F26]'
              }`}
              title={isBookmarked ? '已加入關注' : '加入關注'}
            >
              <Heart className={`w-5 h-5 ${isBookmarked ? 'fill-white' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-neutral-800 hover:bg-[#E21F26] text-white transition-colors cursor-pointer"
              aria-label="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tighter text-white">{store.name}</h2>
          {store.nameEn && <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">{store.nameEn}</p>}

          <p className="text-xs text-neutral-300 font-semibold flex items-center gap-1.5 mb-3">
            <MapPin className="w-3.5 h-3.5 text-[#E21F26] shrink-0" />
            <span className="truncate">{store.address}</span>
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider border ${storeStatusInfo.bgColor} ${storeStatusInfo.textColor} ${storeStatusInfo.borderColor}`}>
              {storeStatusInfo.label}
            </span>

            <span className={`px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider border ${ticketStatusInfo.bgColor} ${ticketStatusInfo.textColor} ${ticketStatusInfo.borderColor}`}>
              {ticketStatusInfo.label}
            </span>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-white hover:text-[#E21F26] bg-neutral-800 hover:bg-neutral-700 px-2.5 py-0.5 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>GOOGLE 地圖</span>
            </a>
          </div>
        </div>

        {/* Scrollable Modal Content Area */}
        <div className="flex-1 overflow-y-auto">
            {/* Latest Calling Numbers */}
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-tight">
                  最新叫號
                </span>
                <button
                  onClick={() => onRefreshQueue(store.id, store.name)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-black uppercase transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-[#E21F26]' : ''}`} />
                  <span>更新</span>
                </button>
              </div>

              {recentNumbers.length > 0 ? (
                <div className="flex items-center justify-center gap-3">
                  {recentNumbers.map((num, idx) => (
                    <div key={num} className="flex items-center gap-3">
                      <span className={`text-2xl sm:text-3xl font-black tabular-nums ${
                        idx === 0 ? 'text-[#E21F26]' : 'text-neutral-900 dark:text-white'
                      }`}>
                        #{num}
                      </span>
                      {idx < recentNumbers.length - 1 && (
                        <span className="text-neutral-300 dark:text-neutral-600 text-lg">→</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-neutral-400 font-bold text-sm py-2">
                  {isServicing ? '暫無叫號資訊' : '門市已休息'}
                </div>
              )}
            </div>

            {/* Ticket Calculator Keypad */}
            <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#E21F26]" />
                  <span>籌號計算器</span>
                </h3>
                {isServicing && allCurrentNums.length > 0 && (
                  <span className="text-xs text-neutral-400">目前最新籌號: <strong className="text-neutral-900 dark:text-white">#{minCalledNum}</strong></span>
                )}
              </div>

              <div className={`mb-4 p-3 rounded-md border text-xs font-bold flex items-center justify-between gap-2 transition-all ${
                ticketValidationState === 'called'
                  ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
                  : ticketValidationState === 'far_future'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                  : ticketValidationState === 'valid'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
              }`}>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{validationMessage}</span>
                </div>
                {myTicket && (
                  <button
                    onClick={() => handleNumpad('clear')}
                    className="text-[10px] underline hover:no-underline cursor-pointer shrink-0"
                  >
                    重設輸入
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-[11px]">
                    <span className="text-neutral-400 font-bold">快速輸入:</span>
                    <button
                      disabled={!isServicing}
                      onClick={() => handleQuickPreset('called')}
                      className={`px-2 py-0.5 rounded transition-colors font-bold ${
                        !isServicing
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed opacity-50'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-[#E21F26] hover:text-white cursor-pointer'
                      }`}
                    >
                      #{minCalledNum} (叫號中)
                    </button>
                    <button
                      disabled={!isServicing}
                      onClick={() => handleQuickPreset('next10')}
                      className={`px-2 py-0.5 rounded transition-colors font-bold ${
                        !isServicing
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed opacity-50'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-[#E21F26] hover:text-white cursor-pointer'
                      }`}
                    >
                      +#{minCalledNum + 10}
                    </button>
                    <button
                      disabled={!isServicing}
                      onClick={() => handleQuickPreset('next25')}
                      className={`px-2 py-0.5 rounded transition-colors font-bold ${
                        !isServicing
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed opacity-50'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-[#E21F26] hover:text-white cursor-pointer'
                      }`}
                    >
                      +#{minCalledNum + 25}
                    </button>
                  </div>

                  <div className={`mb-3 p-3 bg-white dark:bg-neutral-800 border-2 rounded-lg text-center h-12 flex items-center justify-between px-4 ${myTicket ? 'border-[#E21F26]' : 'border-neutral-200 dark:border-neutral-700'}`}>
                    <span className="text-xs font-bold text-neutral-400">您輸入的籌號</span>
                    <span className={`text-2xl font-black tracking-widest tabular-nums ${myTicket ? 'text-[#E21F26]' : 'text-neutral-300 dark:text-neutral-600'}`}>
                      {myTicket ? `#${myTicket}` : '---'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-lg font-bold">
                    {['7', '8', '9', '4', '5', '6', '1', '2', '3', 'clear', '0', 'del'].map((k) => (
                      <button
                        key={k}
                        disabled={!isServicing}
                        onClick={() => handleNumpad(k)}
                        className={`py-2 sm:py-2 rounded-md border text-center transition-all font-black text-sm sm:text-base ${
                          !isServicing
                            ? 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-450 cursor-not-allowed opacity-50'
                            : k === 'del' || k === 'clear'
                            ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 active:scale-95'
                            : 'bg-neutral-50 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white active:scale-95'
                        }`}
                      >
                        {k === 'del' ? '⌫ 刪除' : k === 'clear' ? 'C 清除' : k}
                      </button>
                    ))}
                  </div>
                </div>

                {!isServicing ? (
                  <div className="flex flex-col gap-3 justify-between">
                    <button
                      disabled
                      className="border-2 border-[#E21F26] text-[#E21F26] rounded-lg p-4 text-center flex-1 flex flex-col items-center justify-center min-h-[45px] font-black text-sm bg-transparent opacity-60 pointer-events-none"
                    >
                      收工
                    </button>
                    <button
                      disabled
                      className="border-2 border-[#E21F26] text-[#E21F26] rounded-lg p-4 text-center flex-1 flex flex-col items-center justify-center min-h-[45px] font-black text-sm bg-transparent opacity-60 pointer-events-none"
                    >
                      等開工
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 justify-between">
                    <div className={`border-2 rounded-lg p-4 text-center flex-1 flex flex-col items-center justify-center min-h-[90px] transition-all ${
                      ticketValidationState === 'called'
                        ? 'bg-red-50 border-red-300 dark:bg-red-950/40 dark:border-red-80'
                        : hasNoQueue && ticketValidationState === 'valid'
                        ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
                        : 'bg-white dark:bg-neutral-800 border-[#E21F26]'
                    }`}>
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">
                        輪候進度
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                        {ticketValidationState === 'empty'
                          ? '請輸入籌號'
                          : ticketValidationState === 'called'
                          ? '已過號 / 到您入座'
                          : hasNoQueue && ticketValidationState === 'valid'
                          ? '直入'
                          : `尚有 ${groupsAhead} 組`}
                      </span>
                    </div>

                    <div className={`border-2 rounded-lg p-4 text-center flex-1 flex flex-col items-center justify-center min-h-[90px] ${
                      hasNoQueue && ticketValidationState === 'valid'
                        ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                    }`}>
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">
                        預估等候時間
                      </span>
                      <span className={`text-2xl sm:text-3xl font-black ${
                        hasNoQueue && ticketValidationState === 'valid'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-[#E21F26]'
                      }`}>
                        {ticketValidationState === 'empty'
                          ? '-- 分鐘'
                          : ticketValidationState === 'called'
                          ? '即刻前往櫃檯'
                          : hasNoQueue && ticketValidationState === 'valid'
                          ? '約0分鐘'
                          : `約 ${estimatedMins} 分鐘`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

        </div>

        {/* Fixed Modal Footer */}
        <div className="shrink-0 p-3 sm:p-4 bg-[#141414] border-t border-neutral-800 flex justify-between items-center text-xs text-neutral-400">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>即時數據已同步</span>
          </div>
          <span className="text-[11px] text-neutral-500 font-mono">壽司郎即時數據</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
