import React, { useState, useEffect } from 'react';
import { SushiroStore, GroupQueue } from '../types';
import { getStoreStatusInfo, getTicketStatusInfo, formatGoogleMapsUrl } from '../utils/status';
import { X, RefreshCw, Heart, MapPin, ExternalLink, Ticket, Info, TrendingUp, TrendingDown, Minus, Calculator, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface StoreDetailModalProps {
  store: SushiroStore | null;
  queue: GroupQueue | null;
  loading: boolean;
  isBookmarked: boolean;
  initialViewMode?: 'live' | 'history';
  onClose: () => void;
  onRefreshQueue: (storeId: number, storeName: string) => void;
  onToggleBookmark: (store: SushiroStore) => void;
}

export const StoreDetailModal: React.FC<StoreDetailModalProps> = ({
  store,
  queue,
  loading,
  isBookmarked,
  initialViewMode = 'live',
  onClose,
  onRefreshQueue,
  onToggleBookmark,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'booth' | 'counter' | 'store' | 'reservation'>('all');
  const [viewMode, setViewMode] = useState<'live' | 'history'>(initialViewMode);
  const [liveSection, setLiveSection] = useState<'all' | 'calculator' | 'trend' | 'breakdown'>('all');
  const [myTicket, setMyTicket] = useState<string>('');

  // Sync view mode and reset ticket when modal opens for a new store
  useEffect(() => {
    setViewMode(initialViewMode);
    setMyTicket('');
  }, [initialViewMode, store?.id]);

  // State for date management in history table
  const [currentDateObj, setCurrentDateObj] = useState<Date>(new Date(2026, 6, 27)); // Default 2026-07-27
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const dayNamesFull = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  // Derived date selection day of week
  const selectedDayIdx = currentDateObj.getDay();
  const formattedDateStr = `${String(currentDateObj.getDate()).padStart(2, '0')}/${String(currentDateObj.getMonth() + 1).padStart(2, '0')}/${currentDateObj.getFullYear()}`;

  // Date step handler (-1 day or +1 day)
  const handleDateChange = (offsetDays: number) => {
    const newDate = new Date(currentDateObj);
    newDate.setDate(newDate.getDate() + offsetDays);
    setCurrentDateObj(newDate);
  };

  // Select day of week in current week
  const handleSelectDayOfWeek = (targetDayIdx: number) => {
    const currentDay = currentDateObj.getDay();
    const diff = targetDayIdx - currentDay;
    const newDate = new Date(currentDateObj);
    newDate.setDate(newDate.getDate() + diff);
    setCurrentDateObj(newDate);
  };

  // Numpad key press handler with validation
  const handleNumpad = (key: string) => {
    if (key === 'del') {
      setMyTicket((prev) => prev.slice(0, -1));
    } else if (key === 'clear') {
      setMyTicket('');
    } else {
      // Prevent leading double zeros or overly long tickets (>4 digits)
      if (myTicket === '0') {
        setMyTicket(key);
      } else if (myTicket.length < 4) {
        setMyTicket((prev) => prev + key);
      }
    }
  };

  // Quick preset ticket buttons
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
  const ticketStatusInfo = getTicketStatusInfo(store.netTicketStatus, store.storeStatus);
  const mapsUrl = formatGoogleMapsUrl(store.latitude, store.longitude, store.address, store.name);

  // Grouped queue numbers
  const boothNumbers = queue?.boothQueue || queue?.storeBoothQueue || [];
  const counterNumbers = queue?.counterQueue || queue?.storeCounterQueue || [];
  const storeNumbers = queue?.storeQueue || queue?.mixedQueue || [];
  const reservationNumbers = queue?.reservationQueue || queue?.reservationBoothQueue || [];

  const totalNumbersCount =
    boothNumbers.length + counterNumbers.length + storeNumbers.length + reservationNumbers.length;

  // Find lowest calling ticket or current queue base
  const allCurrentNums = [...boothNumbers, ...counterNumbers, ...storeNumbers]
    .map((n) => parseInt(n.replace(/\D/g, ''), 10))
    .filter((n) => !isNaN(n));

  const minCalledNum = allCurrentNums.length > 0 ? Math.min(...allCurrentNums) : Math.max(1, (store.id * 10) % 150 + 50);

  // Keypad & Ticket Calculator Validation Logic
  const myTicketNum = parseInt(myTicket, 10);
  let groupsAhead = 0;
  let estimatedMins = 0;
  let ticketValidationState: 'empty' | 'called' | 'valid' | 'far_future' = 'empty';
  let validationMessage = '';

  if (!myTicket || isNaN(myTicketNum) || myTicketNum <= 0) {
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
    validationMessage = `籌號 #${myTicketNum} 距離目前最新叫號 (#${minCalledNum}) 相差較遠 (${groupsAhead} 組)，請核對票號是否正確。`;
  } else {
    ticketValidationState = 'valid';
    groupsAhead = Math.min(myTicketNum - minCalledNum, 120);
    estimatedMins = Math.max(2, Math.round(groupsAhead * 1.35));
    validationMessage = `正常輪候中：前面尚有 ${groupsAhead} 組，預估等待時間約 ${estimatedMins} 分鐘。`;
  }

  // Dynamic Historical Records Data Generator based on selected date & store
  const isWeekend = selectedDayIdx === 0 || selectedDayIdx === 6;
  const isFriday = selectedDayIdx === 5;
  const dayMultiplier = isWeekend ? 1.5 : isFriday ? 1.2 : 0.85;
  const storeSeed = (store.id * 19) % 25;

  const times = [
    '11:00', '11:20', '11:40', '12:00', '12:20', '12:40',
    '13:00', '13:20', '13:40', '14:00', '14:20', '14:40',
    '15:00', '15:20', '15:40', '16:00', '16:20', '16:40',
    '17:00', '17:20', '17:40', '18:00', '18:20', '18:40',
    '19:00', '19:20', '19:40', '20:00', '20:20', '20:40'
  ];

  const historyTimeSlots = times.map((t, idx) => {
    // Base traffic curve
    let baseGroups = 0;
    let ticketStart = 10 + idx * 9;

    if (t >= '12:00' && t <= '13:40') { // Lunch peak
      baseGroups = Math.round((20 + (idx - 3) * 4 + storeSeed) * dayMultiplier);
    } else if (t >= '14:00' && t <= '16:40') { // Afternoon off-peak
      baseGroups = Math.max(0, Math.round((5 - (idx - 9) * 1) * dayMultiplier));
    } else if (t >= '17:20' && t <= '19:40') { // Dinner peak
      baseGroups = Math.round((18 + (idx - 20) * 5 + storeSeed * 1.2) * dayMultiplier);
    } else if (t >= '20:00') { // Late evening
      baseGroups = Math.max(0, Math.round((15 - (idx - 27) * 4) * dayMultiplier));
    }

    const waitMins = baseGroups === 0 ? 0 : Math.max(3, Math.round(baseGroups * 1.25));
    const isAvailable = baseGroups > 0;
    const ticketStr = isAvailable ? `${String(Math.min(999, ticketStart + Math.round(storeSeed))).padStart(3, '0')}` : '—';

    let densityCategory: 'offpeak' | 'medium' | 'peak' = 'offpeak';
    if (waitMins >= 30) densityCategory = 'peak';
    else if (waitMins >= 10) densityCategory = 'medium';

    return {
      time: t,
      groups: baseGroups,
      wait: `${waitMins}分`,
      waitNum: waitMins,
      ticket: ticketStr,
      densityCategory,
    };
  });

  // Generate 1-hour busy trend data
  const isClosed = store.storeStatus !== 'OPEN';
  const seed = (store.id * 37) % 100;
  const trendType = seed % 3;

  let p60 = store.wait;
  let p45 = store.wait;
  let p30 = store.wait;
  let p15 = store.wait;

  if (!isClosed) {
    if (trendType === 0) {
      p60 = Math.max(0, store.wait - Math.floor(10 + (seed % 12)));
      p45 = Math.max(0, store.wait - Math.floor(7 + (seed % 8)));
      p30 = Math.max(0, store.wait - Math.floor(4 + (seed % 5)));
      p15 = Math.max(0, store.wait - Math.floor(2 + (seed % 3)));
    } else if (trendType === 1) {
      p60 = store.wait + Math.floor(12 + (seed % 10));
      p45 = store.wait + Math.floor(8 + (seed % 6));
      p30 = store.wait + Math.floor(5 + (seed % 4));
      p15 = store.wait + Math.floor(2 + (seed % 3));
    } else {
      const delta = (seed % 5) - 2;
      p60 = Math.max(0, store.wait + delta);
      p45 = Math.max(0, store.wait - delta);
      p30 = Math.max(0, store.wait + Math.floor(delta / 2));
      p15 = Math.max(0, store.wait - Math.floor(delta / 2));
    }
  }

  const trendData = [
    { time: '-60m', wait: isClosed ? 0 : p60 },
    { time: '-45m', wait: isClosed ? 0 : p45 },
    { time: '-30m', wait: isClosed ? 0 : p30 },
    { time: '-15m', wait: isClosed ? 0 : p15 },
    { time: '現在', wait: isClosed ? 0 : store.wait },
  ];

  const diff = store.wait - p60;
  let trendBadge = {
    label: '趨勢平穩',
    icon: <Minus className="w-3.5 h-3.5" />,
    color: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300',
  };

  if (!isClosed) {
    if (diff >= 5) {
      trendBadge = {
        label: '人流上升中 (Getting Busier)',
        icon: <TrendingUp className="w-3.5 h-3.5" />,
        color: 'bg-red-50 text-[#E21F26] border-[#E21F26]/40 dark:bg-red-950/60 dark:text-red-300',
      };
    } else if (diff <= -5) {
      trendBadge = {
        label: '人流舒緩中 (Getting Quieter)',
        icon: <TrendingDown className="w-3.5 h-3.5" />,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300',
      };
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden border-2 border-neutral-800 rounded-2xl my-auto">
        {/* Fixed Header */}
        <div className="shrink-0 p-4 sm:p-6 bg-[#141414] text-white relative border-b-4 border-[#E21F26]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800 hover:bg-[#E21F26] text-white transition-colors cursor-pointer z-10"
            aria-label="關閉"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-between gap-2 mb-1 pr-10">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#E21F26]">
              <span className="px-2.5 py-0.5 bg-[#E21F26] text-white rounded-xs">
                {store.area}
              </span>
              {store.distanceKm !== undefined && store.distanceKm !== Infinity && (
                <span className="text-neutral-400">距離 {store.distanceKm} KM</span>
              )}
            </div>
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

        {/* Fixed Primary View Mode Tab Bar */}
        <div className="shrink-0 flex border-b-2 border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 p-1.5 gap-2">
          <button
            onClick={() => setViewMode('live')}
            className={`flex-1 py-2 px-3 font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer rounded-lg flex items-center justify-center gap-2 ${
              viewMode === 'live'
                ? 'bg-[#E21F26] text-white shadow-md'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>即時叫號 & 籌號估算</span>
          </button>

          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 py-2 px-3 font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer rounded-lg flex items-center justify-center gap-2 ${
              viewMode === 'history'
                ? 'bg-[#141414] text-white dark:bg-white dark:text-[#141414] shadow-md'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>歷史模擬</span>
          </button>
        </div>

        {/* Scrollable Modal Content Area */}
        <div className="flex-1 overflow-y-auto">
        {/* VIEW MODE 1: LIVE CALLING & TICKET CALCULATOR */}
        {viewMode === 'live' ? (
          <>
            {/* Calling Status Cards */}
            {allCurrentNums.length > 0 && (
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-tight">
                  叫號狀況 <span className="text-xs font-normal text-sky-600 dark:text-sky-400 cursor-pointer hover:underline" onClick={() => onRefreshQueue(store.id, store.name)}>[手動更新]</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-bold uppercase">目前現場最新發號</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {allCurrentNums.slice(0, 3).map((num, i) => (
                  <div key={i} className="bg-white dark:bg-neutral-800 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 text-center shadow-xs">
                    <span className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tabular-nums">
                      {num}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Ticket Calculator Keypad (籌號試算器) */}
            <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#E21F26]" />
                  <span>籌號計算器</span>
                </h3>
                {allCurrentNums.length > 0 && (
                  <span className="text-xs text-neutral-400">目前最新號碼: <strong className="text-neutral-900 dark:text-white">#{minCalledNum}</strong></span>
                )}
              </div>

              {/* Validation Status Banner */}
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
                {/* Keypad Column */}
                <div>
                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 mb-2 text-[11px]">
                    <span className="text-neutral-400 font-bold">快速輸入:</span>
                    <button
                      onClick={() => handleQuickPreset('called')}
                      className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-[#E21F26] hover:text-white transition-colors cursor-pointer font-bold"
                    >
                      #{minCalledNum} (叫號中)
                    </button>
                    <button
                      onClick={() => handleQuickPreset('next10')}
                      className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-[#E21F26] hover:text-white transition-colors cursor-pointer font-bold"
                    >
                      +#{minCalledNum + 10}
                    </button>
                    <button
                      onClick={() => handleQuickPreset('next25')}
                      className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-[#E21F26] hover:text-white transition-colors cursor-pointer font-bold"
                    >
                      +#{minCalledNum + 25}
                    </button>
                  </div>

                  {/* Entered Display */}
                  <div className={`mb-3 p-3 bg-white dark:bg-neutral-800 border-2 rounded-lg text-center h-12 flex items-center justify-between px-4 ${myTicket ? 'border-[#E21F26]' : 'border-neutral-200 dark:border-neutral-700'}`}>
                    <span className="text-xs font-bold text-neutral-400">您輸入的籌號</span>
                    <span className={`text-2xl font-black tracking-widest tabular-nums ${myTicket ? 'text-[#E21F26]' : 'text-neutral-300 dark:text-neutral-600'}`}>
                      {myTicket ? `#${myTicket}` : '---'}
                    </span>
                  </div>

                  {/* Numpad */}
                  <div className="grid grid-cols-3 gap-1.5 text-lg font-bold">
                    {['7', '8', '9', '4', '5', '6', '1', '2', '3', 'clear', '0', 'del'].map((k) => (
                      <button
                        key={k}
                        onClick={() => handleNumpad(k)}
                        className={`py-2 sm:py-2 rounded-md border text-center transition-all cursor-pointer font-black text-sm sm:text-base active:scale-95 active:bg-neutral-300 dark:active:bg-neutral-600 ${
                          k === 'del' || k === 'clear'
                            ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                            : 'bg-neutral-50 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white'
                        }`}
                      >
                        {k === 'del' ? '⌫ 刪除' : k === 'clear' ? 'C 清除' : k}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estimation Results Column */}
                <div className="flex flex-col gap-3 justify-between">
                  <div className={`border-2 rounded-lg p-4 text-center flex-1 flex flex-col items-center justify-center min-h-[90px] transition-all ${
                    ticketValidationState === 'called'
                      ? 'bg-red-50 border-red-300 dark:bg-red-950/40 dark:border-red-800'
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
                        : `尚有 ${groupsAhead} 組`}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg p-4 text-center flex-1 flex flex-col items-center justify-center min-h-[90px]">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">
                      預估等候時間
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-[#E21F26]">
                      {ticketValidationState === 'empty'
                        ? '-- 分鐘'
                        : ticketValidationState === 'called'
                        ? '即刻前往櫃檯'
                        : `約 ${estimatedMins} 分鐘`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 1-Hour Busy Trend Graph Section */}
            <div className="px-6 sm:px-8 py-5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-black tracking-tight uppercase text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <span>近期人流趨勢（估算）</span>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase">(人流趨勢)</span>
                  </h3>
                </div>

                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${trendBadge.color}`}>
                  {trendBadge.icon}
                  <span>{trendBadge.label}</span>
                </div>
              </div>

              <div className="h-36 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="waitTrendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E21F26" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#E21F26" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33333322" />
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#888888' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#888888' }}
                      unit="m"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#141414',
                        borderColor: '#E21F26',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '12px',
                      }}
                      formatter={(val: number | string | undefined) => [`${val ?? 0} 分鐘`, '預估等候']}
                    />
                    <Area
                      type="monotone"
                      dataKey="wait"
                      stroke="#E21F26"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#waitTrendGrad)"
                      activeDot={{ r: 6, fill: '#E21F26', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Queue Breakdown Tabs */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-[#E21F26]" />
                  <span>即時叫號明細</span>
                  {loading && <RefreshCw className="w-4 h-4 animate-spin text-[#E21F26]" />}
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRefreshQueue(store.id, store.name)}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white text-xs font-black uppercase transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>更新籌號</span>
                  </button>

                  <button
                    onClick={() => onToggleBookmark(store)}
                    className={`p-2 rounded-full transition-all cursor-pointer ${
                      isBookmarked
                        ? 'bg-[#E21F26] text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-[#E21F26]'
                    }`}
                    title={isBookmarked ? '已加入關注' : '加入關注'}
                  >
                    <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-white' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Queue Filter Tabs */}
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 text-xs no-scrollbar">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-full font-black text-xs transition-colors whitespace-nowrap cursor-pointer uppercase ${
                    activeTab === 'all'
                      ? 'bg-[#141414] text-white dark:bg-white dark:text-[#141414]'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  全部 ({totalNumbersCount})
                </button>
                <button
                  onClick={() => setActiveTab('booth')}
                  className={`px-4 py-2 rounded-full font-black text-xs transition-colors whitespace-nowrap cursor-pointer uppercase ${
                    activeTab === 'booth'
                      ? 'bg-[#141414] text-white dark:bg-white dark:text-[#141414]'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  桌席 ({boothNumbers.length})
                </button>
                <button
                  onClick={() => setActiveTab('counter')}
                  className={`px-4 py-2 rounded-full font-black text-xs transition-colors whitespace-nowrap cursor-pointer uppercase ${
                    activeTab === 'counter'
                      ? 'bg-[#141414] text-white dark:bg-white dark:text-[#141414]'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  吧台 ({counterNumbers.length})
                </button>
                <button
                  onClick={() => setActiveTab('store')}
                  className={`px-4 py-2 rounded-full font-black text-xs transition-colors whitespace-nowrap cursor-pointer uppercase ${
                    activeTab === 'store'
                      ? 'bg-[#141414] text-white dark:bg-white dark:text-[#141414]'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  現場/混合 ({storeNumbers.length})
                </button>
                <button
                  onClick={() => setActiveTab('reservation')}
                  className={`px-4 py-2 rounded-full font-black text-xs transition-colors whitespace-nowrap cursor-pointer uppercase ${
                    activeTab === 'reservation'
                      ? 'bg-[#141414] text-white dark:bg-white dark:text-[#141414]'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  預約 ({reservationNumbers.length})
                </button>
              </div>

              {/* Queue Content List */}
              <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                {(activeTab === 'all' || activeTab === 'booth') && (
                  <QueueCategoryBlock
                    title="桌席 (BOOTH QUEUE)"
                    numbers={boothNumbers}
                    badgeColor="bg-red-50 text-[#E21F26] border-[#E21F26]/30 dark:bg-red-950/40 dark:text-red-300"
                  />
                )}

                {(activeTab === 'all' || activeTab === 'counter') && (
                  <QueueCategoryBlock
                    title="吧台 (COUNTER QUEUE)"
                    numbers={counterNumbers}
                    badgeColor="bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300"
                  />
                )}

                {(activeTab === 'all' || activeTab === 'store') && (
                  <QueueCategoryBlock
                    title="現場 / 混合隊列 (STORE/MIXED QUEUE)"
                    numbers={storeNumbers}
                    badgeColor="bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                  />
                )}

                {(activeTab === 'all' || activeTab === 'reservation') && (
                  <QueueCategoryBlock
                    title="預約隊列 (RESERVATION QUEUE)"
                    numbers={reservationNumbers}
                    badgeColor="bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                  />
                )}

                {totalNumbersCount === 0 && (
                  <div className="text-center py-8 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 p-6">
                    <Info className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                    <p className="text-neutral-800 dark:text-neutral-200 font-bold text-sm">
                      暫無籌號資訊 / 目前未有人輪候
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* VIEW MODE 2: SIMULATED HISTORICAL DATA (Estimated based on time-of-day patterns) */
          <div className="p-6 sm:p-8">
            {/* Disclaimer Banner */}
            <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>以下數據為基於時段與星期類型之模擬估算，並非真實歷史紀錄。僅供參考 typical traffic pattern。</span>
            </div>

            {/* Date Picker Header */}
            <div className="flex items-center justify-between mb-3 bg-neutral-50 dark:bg-neutral-800/80 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => handleDateChange(-1)}
                className="p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white cursor-pointer text-xs font-black flex items-center gap-1 transition-colors"
                title="前一天"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>前一天</span>
              </button>

              <div className="text-center">
                <div className="text-base sm:text-lg font-black tracking-tight text-neutral-900 dark:text-white flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4 text-[#E21F26]" />
                  <span>{formattedDateStr}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#E21F26] text-white font-bold">{dayNamesFull[selectedDayIdx]}</span>
                </div>
                <div className="text-[11px] text-neutral-400 font-bold mt-0.5">
                  {isWeekend ? '🔥 週末假日 (尖峰時段等候較長)' : isFriday ? '⚡ 星期五小週末 (晚市熱門)' : '☕ 平日時段 (流動迅速)'}
                </div>
              </div>

              <button
                onClick={() => handleDateChange(1)}
                className="p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white cursor-pointer text-xs font-black flex items-center gap-1 transition-colors"
                title="後一天"
              >
                <span>後一天</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day of Week Selector */}
            <div className="flex items-center justify-between gap-1.5 mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-3 overflow-x-auto no-scrollbar">
              {daysOfWeek.map((day, idx) => (
                <button
                  key={day}
                  onClick={() => handleSelectDayOfWeek(idx)}
                  className={`flex-1 min-w-[40px] py-2 rounded-lg font-black text-xs transition-all cursor-pointer flex flex-col items-center justify-center ${
                    selectedDayIdx === idx
                      ? 'bg-[#E21F26] text-white shadow-md scale-105 ring-2 ring-[#E21F26]/40'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  <span className="text-[10px] opacity-80 uppercase">{day}</span>
                  <span className="text-xs font-extrabold">{dayNamesFull[idx].replace('星期', '周')}</span>
                </button>
              ))}
            </div>

            {/* Historical Log Table */}
            <div className="max-h-[380px] overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-bold sticky top-0 border-b border-neutral-200 dark:border-neutral-700 z-10">
                  <tr>
                    <th className="py-3 px-4">時間</th>
                    <th className="py-3 px-4 text-center">人流狀態</th>
                    <th className="py-3 px-4 text-center">等候組數</th>
                    <th className="py-3 px-4 text-center">平均等候</th>
                    <th className="py-3 px-4 text-right">籌號</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-medium">
                  {historyTimeSlots.map((row, i) => (
                    <tr
                      key={i}
                      className={`transition-colors ${
                        row.densityCategory === 'peak'
                          ? 'bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono font-bold text-neutral-900 dark:text-white">
                        {row.time}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          row.densityCategory === 'peak'
                            ? 'bg-red-100 text-[#E21F26] dark:bg-red-950 dark:text-red-300'
                            : row.densityCategory === 'medium'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {row.densityCategory === 'peak' ? '🔴 繁忙' : row.densityCategory === 'medium' ? '🟡 中等' : '🟢 順暢'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-neutral-700 dark:text-neutral-300">
                        {row.groups > 0 ? `${row.groups} 組` : '0 組'}
                      </td>
                      <td className={`py-2.5 px-4 text-center font-black ${row.waitNum > 0 ? 'text-[#E21F26]' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {row.wait}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-neutral-600 dark:text-neutral-400">
                        {row.ticket}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>

        {/* Fixed Modal Footer */}
        <div className="shrink-0 p-3 sm:p-4 bg-[#141414] border-t border-neutral-800 flex justify-between items-center text-xs text-neutral-400">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>即時數據已同步</span>
          </div>
          <span className="text-[11px] text-neutral-500 font-mono">壽司郎即時數據</span>
        </div>
      </div>
    </div>
  );
};

interface QueueCategoryBlockProps {
  title: string;
  numbers: string[];
  badgeColor: string;
}

const QueueCategoryBlock: React.FC<QueueCategoryBlockProps> = ({ title, numbers, badgeColor }) => {
  if (!numbers || numbers.length === 0) return null;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">{title}</span>
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">共 {numbers.length} 組</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {numbers.map((num, idx) => (
          <span
            key={`${num}-${idx}`}
            className={`px-3.5 py-1.5 font-mono text-xs font-black border shadow-xs ${badgeColor} ${
              idx === 0 ? 'ring-2 ring-[#E21F26] scale-105' : ''
            }`}
          >
            #{num} {idx === 0 && <span className="text-[10px] font-sans font-bold ml-1 text-[#E21F26] uppercase">(叫號中)</span>}
          </span>
        ))}
      </div>
    </div>
  );
};

