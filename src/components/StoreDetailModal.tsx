import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SushiroStore, GroupQueue } from '../types';
import { getStoreStatusInfo, getTicketStatusInfo, formatGoogleMapsUrl, isStoreServicing, getStoreDisplayStatus, isLocalTicketingOff } from '../utils/status';
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

  if (!store) return null;

  const storeStatusInfo = getStoreStatusInfo(store.storeStatus);
  const ticketStatusInfo = getTicketStatusInfo(store.netTicketStatus, store.storeStatus, store.localTicketingStatus, store.wait, store.waitingGroup);
  const mapsUrl = formatGoogleMapsUrl(store.latitude, store.longitude, store.address, store.name);

  // Parse queue number string like "74-1" or "73" into structured object
  const parseQueueNum = (raw: string): { raw: string; base: number; sub: number; isReservation: boolean } => {
    const cleaned = raw.replace(/^#/, '');
    const parts = cleaned.split('-');
    const base = parseInt(parts[0], 10);
    const sub = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    return { raw: cleaned, base: isNaN(base) ? 0 : base, sub: isNaN(sub) ? 0 : sub, isReservation: !isNaN(base) && base >= 1000 };
  };

  const boothNumbers = [...new Set([
    ...(queue?.boothQueue || []),
    ...(queue?.storeBoothQueue || []),
  ])];
  const counterNumbers = [...new Set([
    ...(queue?.counterQueue || []),
    ...(queue?.storeCounterQueue || []),
  ])];
  const storeNumbers = [...new Set([
    ...(queue?.storeQueue || []),
    ...(queue?.mixedQueue || []),
  ])];

  // Parse all raw strings, filter valid numbers, dedup by raw string
  const allRawNums = [...new Set([...boothNumbers, ...counterNumbers, ...storeNumbers])]
    .map((n) => n.replace(/^#/, ''))
    .filter((n) => {
      const { base } = parseQueueNum(n);
      return !isNaN(base) && base > 0;
    });

  // Sort: walk-in first (by base, sub), then reservation (by base, sub)
  const parsedNums = allRawNums
    .map(parseQueueNum)
    .sort((a, b) => {
      if (a.isReservation !== b.isReservation) return a.isReservation ? 1 : -1;
      return a.base - b.base || a.sub - b.sub;
    });

  // Walk-in only for calculator comparison
  const walkInNums = parsedNums.filter((n) => !n.isReservation);
  const minCalledNum = walkInNums.length > 0 ? walkInNums[0].base : 0;
  const hasNoQueue = walkInNums.length === 0 && parsedNums.length === 0;

  const isServicing = isStoreServicing(store);

  // 3 most recent called numbers — walk-in smallest first, then reservations
  const recentNumbers = parsedNums.slice(0, 3);

  const myTicketNum = parseInt(myTicket, 10);
  let groupsAhead = 0;
  let estimatedMins = 0;
  let ticketValidationState: 'empty' | 'called' | 'valid' | 'far_future' = 'empty';
  let validationMessage = '';

  if (loading) {
    ticketValidationState = 'empty';
    validationMessage = '正在載入叫號資料…';
  } else if (!isServicing) {
    ticketValidationState = 'empty';
    if (store.storeStatus !== 'OPEN') {
      validationMessage = '門市非營業中，籌號計算器暫停使用';
    } else {
      const isFinished = isLocalTicketingOff(store.localTicketingStatus) && store.wait === 0 && store.waitingGroup === 0;
      validationMessage = isFinished
        ? '門市當日營業已結束，籌號計算器暫停使用'
        : '門市停籌，籌號計算器暫停使用';
    }
  } else if (hasNoQueue) {
    ticketValidationState = 'valid';
    groupsAhead = 0;
    estimatedMins = 0;
    validationMessage = '目前無輪候，可即時入座';
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
    estimatedMins = Math.max(2, Math.round(groupsAhead * 1.3));
    validationMessage = `籌號 #${myTicketNum} 距離目前最新叫號 (#${minCalledNum}) 相差較遠 (${groupsAhead} 組)，請核對籌號是否正確。`;
  } else {
    ticketValidationState = 'valid';
    groupsAhead = myTicketNum - minCalledNum;
    estimatedMins = Math.max(2, Math.round(groupsAhead * 1.35));
    validationMessage = `正常輪候中：前面尚有 ${groupsAhead} 組，預估等待約 ${estimatedMins} 分鐘。`;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden border-2 border-neutral-800 rounded-2xl my-auto"
      >
        {/* Fixed Header */}
        <div className="shrink-0 p-4 sm:p-6 bg-[#141414] text-white relative border-b-4 border-[#aa151b]">
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={() => onToggleBookmark(store)}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                isBookmarked
                  ? 'bg-[#aa151b] text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:text-[#aa151b]'
              }`}
              title={isBookmarked ? '已加入關注' : '加入關注'}
            >
              <Heart className={`w-5 h-5 ${isBookmarked ? 'fill-white' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-neutral-800 hover:bg-[#aa151b] text-white transition-colors cursor-pointer"
              aria-label="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tighter text-white">{store.name}</h2>
          {store.nameEn && <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">{store.nameEn}</p>}

          <p className="text-xs text-neutral-300 font-semibold flex items-center gap-1.5 mb-3">
            <MapPin className="w-3.5 h-3.5 text-[#aa151b] shrink-0" />
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
              className="inline-flex items-center gap-1 text-[11px] font-bold text-white hover:text-[#aa151b] bg-neutral-800 hover:bg-neutral-700 px-2.5 py-0.5 transition-colors"
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
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-[#aa151b]' : ''}`} />
                  <span>更新</span>
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-3">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#aa151b]" />
                  <span className="text-sm font-bold text-neutral-400">載入中...</span>
                </div>
              ) : recentNumbers.length > 0 ? (
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {recentNumbers.map((num, idx) => (
                    <div key={num.raw} className="flex items-center gap-3">
                      <span className={`text-2xl sm:text-3xl font-black tabular-nums ${
                        idx === 0 ? 'text-[#aa151b]' : 'text-neutral-900 dark:text-white'
                      }`}>
                        #{num.raw}
                        {num.isReservation && (
                          <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 ml-1">(預約)</span>
                        )}
                      </span>
                      {idx < recentNumbers.length - 1 && (
                        <span className="text-neutral-300 dark:text-neutral-600 text-lg">→</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-neutral-400 font-bold text-sm py-2">
                  {isServicing ? '暫無叫號資料' : '門市非營業中'}
                </div>
              )}
            </div>

            {/* Ticket Calculator Keypad */}
            <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#aa151b]" />
                  <span>籌號計算器</span>
                </h3>
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
                    清除輸入
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className={`mb-3 p-3 bg-white dark:bg-neutral-800 border-2 rounded-lg text-center h-12 flex items-center justify-between px-4 ${myTicket ? 'border-[#aa151b]' : 'border-neutral-200 dark:border-neutral-700'}`}>
                    <span className="text-xs font-bold text-neutral-400">您輸入的籌號</span>
                    <span className={`text-2xl font-black tracking-widest tabular-nums ${myTicket ? 'text-[#aa151b]' : 'text-neutral-300 dark:text-neutral-600'}`}>
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
                      className="border-2 border-[#aa151b] text-[#aa151b] rounded-lg p-4 text-center flex-1 flex flex-col items-center justify-center min-h-[45px] font-black text-sm bg-transparent opacity-60 pointer-events-none"
                    >
                      已結束營業
                    </button>
                    <button
                      disabled
                      className="border-2 border-[#aa151b] text-[#aa151b] rounded-lg p-4 text-center flex-1 flex flex-col items-center justify-center min-h-[45px] font-black text-sm bg-transparent opacity-60 pointer-events-none"
                    >
                      等待開門
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 justify-between">
                    <div className={`border-2 rounded-lg p-4 text-center flex-1 flex flex-col items-center justify-center min-h-[90px] transition-all ${
                      ticketValidationState === 'called'
                        ? 'bg-red-50 border-red-300 dark:bg-red-950/40 dark:border-red-80'
                        : hasNoQueue && ticketValidationState === 'valid'
                        ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
                        : 'bg-white dark:bg-neutral-800 border-[#aa151b]'
                    }`}>
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">
                        輪候進度
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                        {ticketValidationState === 'empty'
                          ? '請輸入籌號'
                          : ticketValidationState === 'called'
                          ? '已過號 / 即時入座'
                          : hasNoQueue && ticketValidationState === 'valid'
                          ? '即時入座'
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
                          : 'text-[#aa151b]'
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
        <div className="shrink-0 p-3 sm:p-4 bg-[#141414] border-t border-neutral-800 flex items-center justify-center text-xs text-neutral-400">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>即時資料已同步</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
