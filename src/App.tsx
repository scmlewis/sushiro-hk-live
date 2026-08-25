import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SushiroStore, StoreQueueMap, ToastMessage, TabId } from './types';
import { FALLBACK_LOCATION, TEXT_SIZE_MAP, TOTAL_STORE_COUNT, MAX_COMPARE_STORES, POLL_INTERVAL_MS, BRAND_COLOR } from './config';
import { calculateDistanceKm, getCurrentPosition } from './utils/geolocation';
import { getStoreRegion, isStoreIssuingTickets } from './utils/status';
import { useBookmarks } from './hooks/useBookmarks';
import { useTextSize, useViewMode, useFilters } from './hooks/useFilters';
import { Navbar } from './components/Navbar';
import { BookmarksSection } from './components/BookmarksSection';
import { DistrictFilterBar } from './components/DistrictFilterBar';
import { CompactStoreRow } from './components/CompactStoreRow';
import { StoreMap } from './components/StoreMap';
import { StoreDetailModal } from './components/StoreDetailModal';
import { CompareView } from './components/CompareView';
import { AboutSection } from './components/AboutSection';
import { FareCalculator } from './components/FareCalculator';
import { Toast } from './components/Toast';
import { LoadingSplash } from './components/LoadingSplash';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AlertCircle } from 'lucide-react';
import noStoresFoundImg from './assets/images/no_stores_found_1785143279312.jpg';

export default function App() {
  const { textSize, setTextSize } = useTextSize();
  const { viewMode, setViewMode } = useViewMode();
  const { bookmarkedIds, toggleBookmark, clearBookmarks } = useBookmarks();
  const filters = useFilters();

  useEffect(() => {
    document.documentElement.style.fontSize = TEXT_SIZE_MAP[textSize];
  }, [textSize]);

  const [stores, setStores] = useState<SushiroStore[]>([]);
  const [queues, setQueues] = useState<StoreQueueMap>({});
  const [loadingStores, setLoadingStores] = useState(true);
  const [errorStores, setErrorStores] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<TabId>('all');
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [selectedStoreModal, setSelectedStoreModal] = useState<SushiroStore | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [isStaleData, setIsStaleData] = useState(false);

  const tabVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  };

  const showToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    setToast({ id: Date.now().toString(), text, type });
  }, []);

  const fetchStores = useCallback(async (force = false) => {
    setLoadingStores(true);
    setErrorStores(null);
    try {
      const res = await fetch(`/api/stores${force ? '?force=true' : ''}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.stores)) {
        setStores(data.stores);
        setLastUpdated(data.timestamp || Date.now());
        setIsStaleData(data.stale === true);
        if (force) {
          showToast(`已更新全港 ${TOTAL_STORE_COUNT} 間門市資料`, 'success');
        }
      } else {
        throw new Error(data.error || '無法載入門市資料');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('Failed to load stores:', err);
      setErrorStores(message || '連線失敗，請檢查網路設定');
      showToast('伺服器連線失敗，已載入快取資料', 'error');
    } finally {
      setLoadingStores(false);
    }
  }, [showToast]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast('網路已恢復，正在更新資料', 'success');
      fetchStores(true);
    };
    const handleOffline = () => {
      setIsOffline(true);
      showToast('網路中斷，已啟用離線快取', 'warning');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchStores, showToast]);

  const fetchSingleQueue = useCallback(async (storeId: number, force = false) => {
    setQueues((prev) => ({
      ...prev,
      [storeId]: {
        queue: prev[storeId]?.queue || {
          storeQueue: [], boothQueue: [], counterQueue: [],
          mixedQueue: [], reservationQueue: [], separateQueue: 0,
        },
        lastUpdated: prev[storeId]?.lastUpdated || Date.now(),
        loading: true,
      },
    }));
    try {
      const res = await fetch(`/api/queue?storeid=${storeId}${force ? '&force=true' : ''}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && data.queue) {
        setQueues((prev) => ({
          ...prev,
          [storeId]: { queue: data.queue, lastUpdated: data.timestamp || Date.now(), loading: false },
        }));
      } else {
        setQueues((prev) => ({ ...prev, [storeId]: { ...prev[storeId], loading: false } }));
      }
    } catch (err) {
      console.warn(`[Queue Sync] Store ${storeId} queue update issue:`, err);
      setQueues((prev) => ({ ...prev, [storeId]: { ...prev[storeId], loading: false } }));
    }
  }, []);

  useEffect(() => { fetchStores(false); }, [fetchStores]);

  const refreshPolledQueues = useCallback(() => {
    const ids = Array.from(new Set([...bookmarkedIds, ...compareIds]));
    if (ids.length === 0) return;
    ids.forEach((id) => fetchSingleQueue(id, false));
  }, [bookmarkedIds, compareIds, fetchSingleQueue]);

  useEffect(() => {
    const ids = Array.from(new Set([...bookmarkedIds, ...compareIds]));
    if (ids.length === 0) return;
    ids.forEach((id) => {
      setQueues((prev) => {
        if (!prev[id]) fetchSingleQueue(id, false);
        return prev;
      });
    });

    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (interval !== null) return;
      interval = setInterval(refreshPolledQueues, POLL_INTERVAL_MS);
    };
    const stopPolling = () => {
      if (interval !== null) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshPolledQueues();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === 'visible') {
      startPolling();
    }
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [bookmarkedIds, compareIds, fetchSingleQueue, refreshPolledQueues]);

  const handleToggleBookmark = useCallback((store: SushiroStore) => {
    toggleBookmark(store.id);
    if (bookmarkedIds.includes(store.id)) {
      showToast(`已取消關注：${store.name}`, 'info');
    } else {
      showToast(`已加入關注：${store.name}（每 ${POLL_INTERVAL_MS / 1000} 秒自動更新）`, 'success');
      fetchSingleQueue(store.id, true);
    }
  }, [toggleBookmark, bookmarkedIds, showToast, fetchSingleQueue]);

  const handleToggleCompare = useCallback((store: SushiroStore) => {
    setCompareIds((prev) => {
      const exists = prev.includes(store.id);
      if (exists) {
        showToast(`已移除比較：${store.name}`, 'info');
        return prev.filter((id) => id !== store.id);
      }
      if (prev.length >= MAX_COMPARE_STORES) {
        showToast(`最多可比較 ${MAX_COMPARE_STORES} 間門市`, 'warning');
        return prev;
      }
      showToast(`已加入比較：${store.name}`, 'success');
      fetchSingleQueue(store.id, false);
      return [...prev, store.id];
    });
  }, [showToast, fetchSingleQueue]);

  const handleCompareAllBookmarks = useCallback(() => {
    if (bookmarkedIds.length === 0) return;
    const combined = Array.from(new Set([...compareIds, ...bookmarkedIds])).slice(0, MAX_COMPARE_STORES);
    setCompareIds(combined);
    setActiveMainTab('compare');
    showToast(`已將關注門市加入比較（已加入 ${combined.length} 間）`, 'success');
  }, [bookmarkedIds, compareIds, showToast]);

  const handleClearAllBookmarks = useCallback(() => {
    clearBookmarks();
    showToast('已清空關注列表', 'info');
  }, [clearBookmarks, showToast]);

  const handleAddDefaultCompareStores = useCallback(() => {
    const defaultIds = stores.filter((s) => s.storeStatus === 'OPEN').slice(0, 3).map((s) => s.id);
    if (defaultIds.length > 0) {
      setCompareIds(defaultIds);
      defaultIds.forEach((id) => fetchSingleQueue(id, false));
      showToast(`已載入 ${defaultIds.length} 門市至比較`, 'success');
    }
  }, [stores, showToast, fetchSingleQueue]);

  const handleRequestLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const coords = await getCurrentPosition();
      setUserLocation(coords);
      filters.setSortBy('distance-asc');
      showToast('已取得 GPS 定位，已按距離排序', 'success');
    } catch {
      setUserLocation(FALLBACK_LOCATION);
      filters.setSortBy('distance-asc');
      showToast('無法取得 GPS 定位，已使用預設位置', 'warning');
    } finally {
      setLocationLoading(false);
    }
  }, [showToast, filters.setSortBy]);

  const handleManualStoreRefresh = useCallback(async (storeId: number, storeName: string) => {
    await fetchSingleQueue(storeId, true);
    showToast(`已更新：${storeName}`, 'success');
  }, [fetchSingleQueue, showToast]);

  const handleSelectStoreModal = useCallback((store: SushiroStore) => {
    setSelectedStoreModal(store);
    fetchSingleQueue(store.id, true);
  }, [fetchSingleQueue]);

  const regionCounts = useMemo(() => {
    let hkIsland = 0, kowloon = 0, nt = 0;
    stores.forEach((s) => {
      const reg = getStoreRegion(s);
      if (reg === '港島') hkIsland++;
      else if (reg === '九龍') kowloon++;
      else if (reg === '新界') nt++;
    });
    return { all: stores.length, hkIsland, kowloon, nt };
  }, [stores]);

  const processedStores = useMemo(() => {
    let list = stores.map((s) => {
      let distanceKm: number | undefined = undefined;
      if (userLocation && s.latitude && s.longitude) {
        distanceKm = calculateDistanceKm(userLocation.latitude, userLocation.longitude, s.latitude, s.longitude);
      }
      return { ...s, distanceKm };
    });

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      list = list.filter((s) => {
        const nameLower = s.name.toLowerCase();
        const nameEnLower = (s.nameEn || '').toLowerCase();
        const areaLower = s.area.toLowerCase();
        const addrLower = s.address.toLowerCase();
        if (nameLower.includes(q) || nameEnLower.includes(q) || areaLower.includes(q) || addrLower.includes(q)) return true;
        let qi = 0;
        for (let ci = 0; ci < nameLower.length && qi < q.length; ci++) {
          if (nameLower[ci] === q[qi]) qi++;
        }
        if (qi === q.length) return true;
        qi = 0;
        for (let ci = 0; ci < nameEnLower.length && qi < q.length; ci++) {
          if (nameEnLower[ci] === q[qi]) qi++;
        }
        return qi === q.length;
      });
    }

    if (filters.selectedArea) {
      list = list.filter((s) => getStoreRegion(s) === filters.selectedArea || s.area === filters.selectedArea);
    }

    if (filters.onlyIssuingTickets) {
      list = list.filter((s) => isStoreIssuingTickets(s));
    }

    list.sort((a, b) => {
      if (filters.sortBy === 'wait-asc') {
        const servA = isStoreIssuingTickets(a), servB = isStoreIssuingTickets(b);
        if (servA && !servB) return -1; if (!servA && servB) return 1;
        return a.wait - b.wait;
      }
      if (filters.sortBy === 'wait-desc') {
        const servA = isStoreIssuingTickets(a), servB = isStoreIssuingTickets(b);
        if (servA && !servB) return -1; if (!servA && servB) return 1;
        return b.wait - a.wait;
      }
      if (filters.sortBy === 'groups-desc') {
        const servA = isStoreIssuingTickets(a), servB = isStoreIssuingTickets(b);
        if (servA && !servB) return -1; if (!servA && servB) return 1;
        return b.waitingGroup - a.waitingGroup;
      }
      if (filters.sortBy === 'distance-asc') return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
      if (filters.sortBy === 'area-asc') return a.area.localeCompare(b.area, 'zh-HK');
      if (filters.sortBy === 'name-asc') return a.name.localeCompare(b.name, 'zh-HK');
      return 0;
    });

    return list;
  }, [stores, filters.searchQuery, filters.selectedArea, filters.onlyIssuingTickets, filters.sortBy, userLocation]);

  const bookmarkedIdsSet = useMemo(() => new Set(bookmarkedIds), [bookmarkedIds]);
  const compareIdsSet = useMemo(() => new Set(compareIds), [compareIds]);
  const bookmarkedStores = useMemo(() => stores.filter((s) => bookmarkedIdsSet.has(s.id)), [stores, bookmarkedIdsSet]);
  const comparedStores = useMemo(() => stores.filter((s) => compareIdsSet.has(s.id)), [stores, compareIdsSet]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col pattern-kikkou text-neutral-100 font-sans antialiased transition-colors" style={{ fontSize: TEXT_SIZE_MAP[textSize] }}>
        <Navbar
          lastUpdated={lastUpdated}
          loading={loadingStores}
          bookmarkCount={bookmarkedIds.length}
          compareCount={compareIds.length}
          activeMainTab={activeMainTab}
          onSelectTab={setActiveMainTab}
          onGlobalRefresh={() => fetchStores(true)}
        />

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-8 w-full">
          {isOffline && (
            <div className="mb-6 p-4 bg-[#aa151b] text-white font-black text-xs uppercase tracking-wider flex items-center justify-between shadow-xl border-2 border-white/20 animate-pulse rounded-xl">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>目前網路連線不穩定/離線：已啟用 Service Worker 載入近期的門市離線快取資料</span>
              </div>
              <span className="hidden sm:inline-block bg-black/40 px-3 py-1 text-[10px] uppercase font-mono rounded">離線模式</span>
            </div>
          )}

          {!isOffline && isStaleData && (
            <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span className="font-medium">上游伺服器暫時無法連線，顯示的資料可能為暫存快取</span>
            </div>
          )}

          {errorStores && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <div className="text-xs sm:text-sm font-medium flex-1">{errorStores}（已載入快取資料）</div>
              <button onClick={() => fetchStores(true)} className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer">重試</button>
            </div>
          )}

          <div className="relative">
            <AnimatePresence mode="wait">
              {activeMainTab === 'fare' && (
                <motion.div
                  key="fare"
                  variants={tabVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  <FareCalculator onToast={showToast} />
                </motion.div>
              )}

              {activeMainTab === 'about' && (
                <motion.div
                  key="about"
                  variants={tabVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  <AboutSection textSize={textSize} onTextSizeChange={setTextSize} />
                </motion.div>
              )}

              {activeMainTab === 'bookmarks' && (
                <motion.div
                  key="bookmarks"
                  variants={tabVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  <BookmarksSection
                    bookmarkedStores={bookmarkedStores} queues={queues} compareList={compareIds}
                    pollIntervalMs={POLL_INTERVAL_MS} onToggleBookmark={handleToggleBookmark}
                    onToggleCompare={handleToggleCompare} onRefreshQueue={handleManualStoreRefresh}
                    onSelectStore={handleSelectStoreModal} onGoToAllStores={() => setActiveMainTab('all')}
                    onCompareAllBookmarks={handleCompareAllBookmarks} onClearAllBookmarks={handleClearAllBookmarks}
                  />
                </motion.div>
              )}

              {activeMainTab === 'compare' && (
                <motion.div
                  key="compare"
                  variants={tabVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  <CompareView
                    stores={comparedStores} queues={queues}
                    onRemoveFromCompare={(id) => setCompareIds((prev) => prev.filter((item) => item !== id))}
                    onClearCompare={() => setCompareIds([])} onRefreshQueue={handleManualStoreRefresh}
                    onSelectStore={(store) => handleSelectStoreModal(store)} onAddDefaultStores={handleAddDefaultCompareStores}
                  />
                </motion.div>
              )}

                  {activeMainTab === 'all' && (
                <motion.div
                  key="all"
                  variants={tabVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  <DistrictFilterBar
                    regionCounts={regionCounts} selectedArea={filters.selectedArea}
                    searchQuery={filters.searchQuery} sortBy={filters.sortBy}
                    onlyIssuingTickets={filters.onlyIssuingTickets} userLocation={userLocation}
                    locationLoading={locationLoading} onSelectArea={filters.setSelectedArea}
                    onSearchChange={filters.setSearchQuery} onSortChange={filters.setSortBy}
                    onToggleOnlyIssuing={() => filters.setOnlyIssuingTickets((prev) => !prev)}
                    onRequestLocation={handleRequestLocation} viewMode={viewMode} onViewModeChange={setViewMode}
                  />

                  {loadingStores && stores.length === 0 ? (
                    <></>
                  ) : processedStores.length === 0 ? (
                    <div className="text-center py-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] max-w-xl mx-auto my-6 rounded-2xl">
                      <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-4 overflow-hidden rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center p-2">
                        <img src={noStoresFoundImg} alt="未找到搜尋門市" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                      </div>
                      <h3 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white uppercase">未找到符合條件的門市</h3>
                      <p className="text-xs font-bold text-neutral-400 mt-2 max-w-md mx-auto tracking-wide">請嘗試清除搜尋關鍵字、切換全港地區，或取消「僅顯示派籌中」篩選。</p>
                      <button onClick={filters.resetFilters} className="mt-6 px-6 py-2.5 rounded-full bg-[#aa151b] text-white font-black text-xs uppercase tracking-wider transition-all hover:bg-red-700 cursor-pointer shadow-md">重置所有篩選條件</button>
                    </div>
                  ) : (
                    <div>
                      {viewMode !== 'map' && (
                        <div className="flex items-center justify-between mb-3 px-1">
                          <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">顯示 {processedStores.length} 間門市 (全港 {TOTAL_STORE_COUNT} 間)</span>
                          <span className="text-xs text-neutral-400 hidden sm:inline">點擊門市「詳情」可查看即時叫號明細</span>
                        </div>
                      )}
                      {viewMode === 'map' ? (
                        <StoreMap stores={processedStores} queues={queues} userLocation={userLocation} onSelectStore={handleSelectStoreModal} />
                      ) : (
                        <div className="flex flex-col space-y-2">
                          {processedStores.map((store) => {
                            const qData = queues[store.id];
                            return (
                              <CompactStoreRow
                                key={`compact-store-${store.id}`} store={store} queue={qData?.queue} queueLoading={qData?.loading}
                                isBookmarked={bookmarkedIdsSet.has(store.id)} isComparing={compareIdsSet.has(store.id)}
                                onToggleBookmark={handleToggleBookmark} onToggleCompare={handleToggleCompare}
                                onRefreshQueue={handleManualStoreRefresh} onSelectStore={handleSelectStoreModal}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <AnimatePresence>
          {loadingStores && stores.length === 0 && (
            <LoadingSplash />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedStoreModal && (
            <StoreDetailModal
              store={selectedStoreModal}
              queue={selectedStoreModal ? queues[selectedStoreModal.id]?.queue || null : null}
              loading={selectedStoreModal ? queues[selectedStoreModal.id]?.loading || false : false}
              isBookmarked={selectedStoreModal ? bookmarkedIdsSet.has(selectedStoreModal.id) : false}
              onClose={() => setSelectedStoreModal(null)}
              onRefreshQueue={handleManualStoreRefresh}
              onToggleBookmark={handleToggleBookmark}
              onToast={showToast}
            />
          )}
        </AnimatePresence>

        <Toast toast={toast} onDismiss={() => setToast(null)} />
        <div id="fare-bottom-bar-root" />
      </div>
    </ErrorBoundary>
  );
}
