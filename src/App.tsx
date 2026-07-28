import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SushiroStore, StoreQueueMap, SortOption, ToastMessage } from './types';
import { calculateDistanceKm, getCurrentPosition } from './utils/geolocation';
import { getStoreRegion } from './utils/status';
import { Navbar } from './components/Navbar';
import { BookmarksSection } from './components/BookmarksSection';
import { DistrictFilterBar } from './components/DistrictFilterBar';
import { CompactStoreRow } from './components/CompactStoreRow';
import { StoreDetailModal } from './components/StoreDetailModal';
import { CompareDrawer } from './components/CompareDrawer';
import { AboutSection } from './components/AboutSection';
import { Toast } from './components/Toast';
import { AlertCircle, Layers, ChevronUp } from 'lucide-react';
import noStoresFoundImg from './assets/images/no_stores_found_1785143279312.jpg';

const BOOKMARKS_STORAGE_KEY = 'sushiro_hk_bookmarks_v1';
const TEXT_SIZE_KEY = 'sushiro_hk_text_size';
type TextSize = 'S' | 'M' | 'L';
const TEXT_SIZE_MAP: Record<TextSize, string> = { S: '13px', M: '15px', L: '17px' };

export default function App() {
  const [textSize, setTextSize] = useState<TextSize>(() => {
    try {
      const saved = localStorage.getItem(TEXT_SIZE_KEY);
      return (saved as TextSize) || 'M';
    } catch { return 'M'; }
  });

  useEffect(() => {
    try { localStorage.setItem(TEXT_SIZE_KEY, textSize); } catch {}
  }, [textSize]);
  const [stores, setStores] = useState<SushiroStore[]>([]);
  const [queues, setQueues] = useState<StoreQueueMap>({});
  const [loadingStores, setLoadingStores] = useState<boolean>(true);
  const [errorStores, setErrorStores] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Main Navigation Tab ('all' | 'bookmarks' | 'compare' | 'about')
  const [activeMainTab, setActiveMainTab] = useState<'all' | 'bookmarks' | 'compare' | 'about'>('all');

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('wait-asc');
  const [onlyIssuingTickets, setOnlyIssuingTickets] = useState<boolean>(false);

  // Bookmarks & Compare
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);

  // Modal & Geolocation
  const [selectedStoreModal, setSelectedStoreModal] = useState<SushiroStore | null>(null);
  const [modalInitialMode, setModalInitialMode] = useState<'live' | 'history'>('live');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Online / Offline Status State for Service Worker cache
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  // Auto Refresh countdown timer for bookmarked stores (10 seconds)
  const [autoRefreshTimer, setAutoRefreshTimer] = useState<number>(10);

  const showToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    setToast({ id: Date.now().toString(), text, type });
  }, []);

  // Fetch all stores from backend proxy
  const fetchStores = useCallback(async (force = false) => {
    setLoadingStores(true);
    setErrorStores(null);
    try {
      const res = await fetch(`/api/stores${force ? '?force=true' : ''}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.stores)) {
        setStores(data.stores);
        setLastUpdated(data.timestamp || Date.now());

        if (force) {
          showToast('已更新全港 44 間壽司郎門市資料', 'success');
        }
      } else {
        throw new Error(data.error || '無法取得門市列表');
      }
    } catch (err: any) {
      console.warn('Failed to load stores:', err);
      setErrorStores(err.message || '連線失敗，請檢查網路設定');
      showToast('連線至伺服器失敗，將嘗試使用快取資料', 'error');
    } finally {
      setLoadingStores(false);
    }
  }, [showToast]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast('網路已恢復連線，正在更新門市資料', 'success');
      fetchStores(true);
    };
    const handleOffline = () => {
      setIsOffline(true);
      showToast('網路連線中斷：已啟用 Service Worker 離線快取模式', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchStores, showToast]);

  // Fetch queue for a single store
  const fetchSingleQueue = useCallback(async (storeId: number, force = false) => {
    setQueues((prev) => ({
      ...prev,
      [storeId]: {
        queue: prev[storeId]?.queue || {
          storeQueue: [],
          boothQueue: [],
          counterQueue: [],
          mixedQueue: [],
          reservationQueue: [],
          separateQueue: 0,
        },
        lastUpdated: prev[storeId]?.lastUpdated || Date.now(),
        loading: true,
      },
    }));

    try {
      const res = await fetch(`/api/queue?storeid=${storeId}${force ? '&force=true' : ''}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success && data.queue) {
        setQueues((prev) => ({
          ...prev,
          [storeId]: {
            queue: data.queue,
            lastUpdated: data.timestamp || Date.now(),
            loading: false,
          },
        }));
      } else {
        setQueues((prev) => ({
          ...prev,
          [storeId]: { ...prev[storeId], loading: false },
        }));
      }
    } catch (err) {
      console.warn(`[Queue Sync] Store ${storeId} queue update issue:`, err);
      setQueues((prev) => ({
        ...prev,
        [storeId]: { ...prev[storeId], loading: false },
      }));
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStores(false);
  }, [fetchStores]);

  // Save Bookmarks
  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarkedIds));
    } catch (e) {
      console.warn('Failed to save bookmarks', e);
    }
  }, [bookmarkedIds]);

  // Fetch queues for bookmarked stores
  const refreshBookmarkedQueues = useCallback(() => {
    if (bookmarkedIds.length === 0) return;
    bookmarkedIds.forEach((id) => {
      fetchSingleQueue(id, true);
    });
  }, [bookmarkedIds, fetchSingleQueue]);

  // 10s Timer interval for bookmarked stores (Smart Polling requirement F6)
  useEffect(() => {
    if (bookmarkedIds.length === 0) return;

    // Immediately fetch queues for any newly bookmarked stores missing from queues map
    bookmarkedIds.forEach((id) => {
      setQueues((prev) => {
        if (!prev[id]) {
          fetchSingleQueue(id, false);
        }
        return prev;
      });
    });

    const interval = setInterval(() => {
      setAutoRefreshTimer((prev) => {
        if (prev <= 1) {
          refreshBookmarkedQueues();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [bookmarkedIds, fetchSingleQueue, refreshBookmarkedQueues]);

  // Toggle Bookmark
  const handleToggleBookmark = useCallback((store: SushiroStore) => {
    setBookmarkedIds((prev) => {
      const exists = prev.includes(store.id);
      if (exists) {
        showToast(`已移除標記：${store.name}`, 'info');
        return prev.filter((id) => id !== store.id);
      } else {
        showToast(`已標記門市：${store.name} (將每 10 秒自動更新籌號)`, 'success');
        fetchSingleQueue(store.id, true);
        return [...prev, store.id];
      }
    });
  }, [showToast, fetchSingleQueue]);

  // Toggle Compare
  const handleToggleCompare = useCallback((store: SushiroStore) => {
    setCompareIds((prev) => {
      const exists = prev.includes(store.id);
      if (exists) {
        showToast(`已從比較清單移除：${store.name}`, 'info');
        return prev.filter((id) => id !== store.id);
      } else {
        if (prev.length >= 4) {
          showToast('最多可同時比較 4 間門市', 'warning');
          return prev;
        }
        showToast(`已加入比較：${store.name}`, 'success');
        fetchSingleQueue(store.id, false);
        return [...prev, store.id];
      }
    });
  }, [showToast, fetchSingleQueue]);

  // Compare all bookmarked stores
  const handleCompareAllBookmarks = useCallback(() => {
    if (bookmarkedIds.length === 0) return;
    const combined = Array.from(new Set([...compareIds, ...bookmarkedIds])).slice(0, 4);
    setCompareIds(combined);
    setIsCompareOpen(true);
    showToast(`已將關注門市加入即時比對（已加入 ${combined.length} 間）`, 'success');
  }, [bookmarkedIds, compareIds, showToast]);

  // Clear all bookmarks
  const handleClearAllBookmarks = useCallback(() => {
    setBookmarkedIds([]);
    showToast('已清空所有關注門市', 'info');
  }, [showToast]);

  // Add default top stores to compare
  const handleAddDefaultCompareStores = useCallback(() => {
    const defaultIds = stores
      .filter((s) => s.storeStatus === 'OPEN')
      .slice(0, 3)
      .map((s) => s.id);

    if (defaultIds.length > 0) {
      setCompareIds(defaultIds);
      showToast(`已自動載入 ${defaultIds.length} 間門市進入比對`, 'success');
    }
  }, [stores, showToast]);
  const handleRequestLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const coords = await getCurrentPosition();
      setUserLocation(coords);
      setSortBy('distance-asc');
      showToast('已取得 GPS 定位，已按最近距離排序門市', 'success');
    } catch (err: any) {
      // Fallback location: Mong Kok / Central HK (22.3193, 114.1694) so distance sorting works in preview iframe
      const fallbackCoords = { latitude: 22.3193, longitude: 114.1694 };
      setUserLocation(fallbackCoords);
      setSortBy('distance-asc');
      showToast('無法存取真實 GPS，已載入「旺角 / 市中心」作為預設參考位置並計算距離', 'warning');
    } finally {
      setLocationLoading(false);
    }
  }, [showToast]);

  // Manual card refresh button
  const handleManualStoreRefresh = useCallback(async (storeId: number, storeName: string) => {
    await fetchSingleQueue(storeId, true);
    showToast(`已更新【${storeName}】最新籌號與等候時間`, 'success');
  }, [fetchSingleQueue, showToast]);

  // Handle select store modal
  const handleSelectStoreModal = useCallback((store: SushiroStore, mode: 'live' | 'history' = 'live') => {
    setSelectedStoreModal(store);
    setModalInitialMode(mode);
    fetchSingleQueue(store.id, true);
  }, [fetchSingleQueue]);

  // Compute store counts for each main HK region (All / HK Island / Kowloon / NT)
  const regionCounts = useMemo(() => {
    let hkIsland = 0;
    let kowloon = 0;
    let nt = 0;
    stores.forEach((s) => {
      const reg = getStoreRegion(s);
      if (reg === '港島') hkIsland++;
      else if (reg === '九龍') kowloon++;
      else if (reg === '新界') nt++;
    });
    return { all: stores.length, hkIsland, kowloon, nt };
  }, [stores]);

  // Compute stores with distances & applies filters and sorting
  const processedStores = useMemo(() => {
    let list = stores.map((s) => {
      let distanceKm: number | undefined = undefined;
      if (userLocation && s.latitude && s.longitude) {
        distanceKm = calculateDistanceKm(
          userLocation.latitude,
          userLocation.longitude,
          s.latitude,
          s.longitude
        );
      }
      return { ...s, distanceKm };
    });

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.nameEn && s.nameEn.toLowerCase().includes(q)) ||
          s.area.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q)
      );
    }

    // Region Area filter (港島 / 九龍 / 新界)
    if (selectedArea) {
      list = list.filter((s) => getStoreRegion(s) === selectedArea || s.area === selectedArea);
    }

    // Only issuing tickets filter
    if (onlyIssuingTickets) {
      list = list.filter((s) => {
        if (s.storeStatus !== 'OPEN') return false;
        const net = (s.netTicketStatus || '').toUpperCase();
        return net.includes('MANUAL') || net.includes('ONLINE') || net === 'OPEN';
      });
    }

    // Sorting
    list.sort((a, b) => {
      // Always put OPEN stores before non-OPEN if sorting by wait/groups
      if (sortBy === 'wait-asc') {
        if (a.storeStatus === 'OPEN' && b.storeStatus !== 'OPEN') return -1;
        if (a.storeStatus !== 'OPEN' && b.storeStatus === 'OPEN') return 1;
        return a.wait - b.wait;
      }
      if (sortBy === 'wait-desc') {
        if (a.storeStatus === 'OPEN' && b.storeStatus !== 'OPEN') return -1;
        if (a.storeStatus !== 'OPEN' && b.storeStatus === 'OPEN') return 1;
        return b.wait - a.wait;
      }
      if (sortBy === 'groups-desc') {
        if (a.storeStatus === 'OPEN' && b.storeStatus !== 'OPEN') return -1;
        if (a.storeStatus !== 'OPEN' && b.storeStatus === 'OPEN') return 1;
        return b.waitingGroup - a.waitingGroup;
      }
      if (sortBy === 'distance-asc') {
        const distA = a.distanceKm ?? Infinity;
        const distB = b.distanceKm ?? Infinity;
        return distA - distB;
      }
      if (sortBy === 'area-asc') {
        return a.area.localeCompare(b.area, 'zh-HK');
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name, 'zh-HK');
      }
      return 0;
    });

    return list;
  }, [stores, searchQuery, selectedArea, onlyIssuingTickets, sortBy, userLocation]);

  // Bookmarked stores list
  const bookmarkedStores = useMemo(() => {
    return stores.filter((s) => bookmarkedIds.includes(s.id));
  }, [stores, bookmarkedIds]);

  // Compared stores list
  const comparedStores = useMemo(() => {
    return stores.filter((s) => compareIds.includes(s.id));
  }, [stores, compareIds]);

  // Overall quick stats
  const stats = useMemo(() => {
    const openStores = stores.filter((s) => s.storeStatus === 'OPEN');
    const totalWait = openStores.reduce((acc, s) => acc + s.wait, 0);
    const avgWait = openStores.length > 0 ? Math.round(totalWait / openStores.length) : 0;

    let maxWaitStore: SushiroStore | null = null;
    openStores.forEach((s) => {
      if (!maxWaitStore || s.wait > maxWaitStore.wait) {
        maxWaitStore = s;
      }
    });

    const issuingCount = openStores.filter((s) => {
      const net = (s.netTicketStatus || '').toUpperCase();
      return net.includes('MANUAL') || net.includes('ONLINE') || net === 'OPEN';
    }).length;

    return { openCount: openStores.length, avgWait, maxWaitStore, issuingCount };
  }, [stores]);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-red-500 selection:text-white transition-colors pb-16" style={{ fontSize: TEXT_SIZE_MAP[textSize] }}>
      {/* Unified Sticky Top Navbar */}
      <Navbar
        lastUpdated={lastUpdated}
        loading={loadingStores}
        bookmarkCount={bookmarkedIds.length}
        compareCount={compareIds.length}
        storeCount={stores.length}
        activeMainTab={activeMainTab}
        onSelectTab={(tab) => {
          setActiveMainTab(tab);
          if (tab === 'compare') {
            setIsCompareOpen(true);
          }
        }}
        onGlobalRefresh={() => fetchStores(true)}
      />

      {/* Main Container */}
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4">
        {/* Service Worker Offline Cache Notice */}
        {isOffline && (
          <div className="mb-6 p-4 bg-[#E21F26] text-white font-black text-xs uppercase tracking-wider flex items-center justify-between shadow-xl border-2 border-white/20 animate-pulse rounded-xl">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>目前網路連線不穩定/離線：已啟用 Service Worker 載入近期的門市離線快取資料</span>
            </div>
            <span className="hidden sm:inline-block bg-black/40 px-3 py-1 text-[10px] uppercase font-mono rounded">
              離線模式
            </span>
          </div>
        )}

        {/* Error alert banner if upstream failed */}
        {errorStores && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <div className="text-xs sm:text-sm font-medium flex-1">
              {errorStores} (已載入最近之快取門市數據)
            </div>
            <button
              onClick={() => fetchStores(true)}
              className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer"
            >
              重試
            </button>
          </div>
        )}

        {/* Tab Content with Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMainTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* About Section View Tab */}
            {activeMainTab === 'about' && <AboutSection textSize={textSize} onTextSizeChange={setTextSize} />}

            {/* Bookmarked Stores View Tab */}
            {activeMainTab === 'bookmarks' && (
              <BookmarksSection
                bookmarkedStores={bookmarkedStores}
                queues={queues}
                compareList={compareIds}
                autoRefreshTimer={autoRefreshTimer}
                onToggleBookmark={handleToggleBookmark}
                onToggleCompare={handleToggleCompare}
                onRefreshQueue={handleManualStoreRefresh}
                onSelectStore={handleSelectStoreModal}
                onGoToAllStores={() => setActiveMainTab('all')}
                onCompareAllBookmarks={handleCompareAllBookmarks}
                onClearAllBookmarks={handleClearAllBookmarks}
              />
            )}

            {/* All Stores View Tab (Isolated View) */}
            {(activeMainTab === 'all' || activeMainTab === 'compare') && (
              <>
                {/* District Filter & Floating Search & Sort Bar */}
                <DistrictFilterBar
              regionCounts={regionCounts}
              selectedArea={selectedArea}
              searchQuery={searchQuery}
              sortBy={sortBy}
              onlyIssuingTickets={onlyIssuingTickets}
              userLocation={userLocation}
              locationLoading={locationLoading}
              onSelectArea={setSelectedArea}
              onSearchChange={setSearchQuery}
              onSortChange={setSortBy}
              onToggleOnlyIssuing={() => setOnlyIssuingTickets((prev) => !prev)}
              onRequestLocation={handleRequestLocation}
            />

            {/* Compact List / Skeleton Loading */}
            {loadingStores && stores.length === 0 ? (
              <div className="flex flex-col space-y-3">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div
                    key={`skeleton-${idx}`}
                    className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 animate-pulse flex justify-between items-center"
                  >
                    <div className="space-y-2">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-full w-24" />
                      <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded-full w-48" />
                    </div>
                    <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded-xl w-24" />
                  </div>
                ))}
              </div>
            ) : processedStores.length === 0 ? (
              <div className="text-center py-12 px-6 bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 shadow-xl max-w-xl mx-auto my-6 rounded-2xl">
                <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-4 overflow-hidden rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center p-2">
                  <img
                    src={noStoresFoundImg}
                    alt="未找到搜尋門市"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white uppercase">
                  未找到符合條件的門市
                </h3>
                <p className="text-xs font-bold text-neutral-400 mt-2 max-w-md mx-auto tracking-wide">
                  請嘗試清除搜尋關鍵字、切換全港地區，或取消「只看派籌中」篩選。
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedArea('');
                    setOnlyIssuingTickets(false);
                  }}
                  className="mt-6 px-6 py-2.5 rounded-full bg-[#E21F26] text-white font-black text-xs uppercase tracking-wider transition-all hover:bg-red-700 cursor-pointer shadow-md"
                >
                  重置所有篩選條件
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                    顯示 {processedStores.length} 間門市 (全港 44 間)
                  </span>
                  <span className="text-xs text-neutral-400 hidden sm:inline">
                    點擊門市「詳情」可查看即時叫號明細與歷史紀錄
                  </span>
                </div>

                <div className="flex flex-col space-y-2">
                  {processedStores.map((store) => {
                    const qData = queues[store.id];
                    return (
                      <CompactStoreRow
                        key={`compact-store-${store.id}`}
                        store={store}
                        queue={qData?.queue}
                        queueLoading={qData?.loading}
                        isBookmarked={bookmarkedIds.includes(store.id)}
                        isComparing={compareIds.includes(store.id)}
                        onToggleBookmark={handleToggleBookmark}
                        onToggleCompare={handleToggleCompare}
                        onRefreshQueue={handleManualStoreRefresh}
                        onSelectStore={handleSelectStoreModal}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </>)}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bold Typography Theme Footer */}
      <footer className="mt-16 bg-[#141414] text-white px-6 sm:px-8 py-6 border-t-4 border-[#E21F26]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-[11px] font-black tracking-[0.2em] uppercase gap-3 text-neutral-400">
          <div>
            <span>數據來源: </span>
            <span className="text-white">SUSHI-PASS API (HK)</span>
          </div>
          <div>
            <span>免責聲明: </span>
            <span className="text-neutral-300">本網站與壽司郎官方無關</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E21F26] animate-ping" />
            <span className="text-white">輪詢間隔: 10秒</span>
          </div>
        </div>
      </footer>

      {/* Store Detail Modal */}
      <StoreDetailModal
        store={selectedStoreModal}
        queue={selectedStoreModal ? queues[selectedStoreModal.id]?.queue || null : null}
        loading={selectedStoreModal ? queues[selectedStoreModal.id]?.loading || false : false}
        isBookmarked={selectedStoreModal ? bookmarkedIds.includes(selectedStoreModal.id) : false}
        initialViewMode={modalInitialMode}
        onClose={() => setSelectedStoreModal(null)}
        onRefreshQueue={handleManualStoreRefresh}
        onToggleBookmark={handleToggleBookmark}
      />

      {/* Compare Side-by-Side Drawer */}
      <CompareDrawer
        isOpen={isCompareOpen}
        stores={comparedStores}
        queues={queues}
        onClose={() => setIsCompareOpen(false)}
        onRemoveFromCompare={(id) => {
          setCompareIds((prev) => prev.filter((item) => item !== id));
        }}
        onClearCompare={() => setCompareIds([])}
        onRefreshQueue={handleManualStoreRefresh}
        onSelectStore={(store) => handleSelectStoreModal(store, 'live')}
        onAddDefaultStores={handleAddDefaultCompareStores}
      />

      {/* Floating Sticky Compare Pill */}
      {compareIds.length > 0 && !isCompareOpen && (
        <div className="fixed bottom-4 right-4 sm:right-6 z-40 animate-fade-in">
          <button
            onClick={() => setIsCompareOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#141414] hover:bg-[#E21F26] text-white font-black text-xs uppercase rounded-full shadow-2xl border-2 border-white/20 transition-all cursor-pointer group"
          >
            <Layers className="w-4 h-4 text-[#E21F26] group-hover:text-white transition-colors" />
            <span>門市比對</span>
            <span className="px-2 py-0.5 bg-[#E21F26] group-hover:bg-white group-hover:text-[#141414] text-white font-black rounded-full text-[10px]">
              {compareIds.length} / 4
            </span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Toast Notification */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
