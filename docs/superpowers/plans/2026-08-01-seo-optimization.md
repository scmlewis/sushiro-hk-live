# SEO Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all 44 Sushiro store pages indexable by search engines with unique URLs, meta tags, and structured data.

**Architecture:** Add react-router-dom for a `/store/:id` route. Create a custom build script that fetches store data from the upstream API and generates prerendered HTML for each store page with embedded data, meta tags, and JSON-LD structured data. The existing SPA and modal remain untouched.

**Tech Stack:** React 19, react-router-dom, Vite 6, Node.js build script, schema.org JSON-LD

## Global Constraints

- React 19 + TypeScript 5.8 + Vite 6
- Deployed on Vercel (output to `dist/`)
- Upstream API: `https://sushipass.sushiro.com.hk/api/2.0/info/storelist?latitude=22&longitude=114&numresults=100&region=HK`
- Existing modal and tab navigation must remain unchanged
- Brand color: `#aa151b`, theme: dark (`#141414`)

---

## Task 1: Install react-router-dom and Add Routing

**Files:**
- Modify: `package.json`
- Modify: `src/main.tsx`

**Interfaces:**
- Produces: `<BrowserRouter>` wrapping the app, `<Route path="/store/:id">` and `<Route path="*" element={<App />}>` in main.tsx

- [ ] **Step 1: Install react-router-dom**

Run: `npm install react-router-dom`

- [ ] **Step 2: Add routing in main.tsx**

Edit `src/main.tsx` — wrap in `<BrowserRouter>` and add routes. `App.tsx` is **not modified** — it renders unchanged at the catch-all route. `StorePage` is **lazy-loaded** so the main bundle stays the same size (the StorePage chunk only loads on `/store/:id` visits):

```tsx
import {StrictMode, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import App from './App.tsx';
import './index.css';

const StorePage = lazy(() => import('./pages/StorePage.tsx'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/store/:id" element={
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-100/70 dark:bg-slate-950">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-[#aa151b] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              </div>
            </div>
          }>
            <StorePage />
          </Suspense>
        } />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[ServiceWorker] Registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[ServiceWorker] Registration failed:', err);
      });
  });
} else if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch(() => {});
  });
}
```

- [ ] **Step 3: Verify build compiles**

Run: `npm run build`
Expected: Build fails with "cannot find module ./pages/StorePage" — this is expected until Task 2. Run `npm run lint` — the import will error until Task 2 creates the file.

Note: This task's compile check is deferred to Task 2 (StorePage doesn't exist yet). Proceed to Task 2 to create it.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/main.tsx
git commit -m "feat: add react-router-dom with /store/:id route"
```

---

## Task 2: Create StorePage Component

**Files:**
- Create: `src/pages/StorePage.tsx`

**Interfaces:**
- Consumes: `SushiroStore` from `src/types.ts`, status utilities from `src/utils/status.ts`
- Produces: `StorePage` component that reads `:id` from URL, fetches store + queue data, renders full-page store detail

- [ ] **Step 1: Create StorePage.tsx**

Create `src/pages/StorePage.tsx` — a full-page store detail view. This reuses the same data fetching and rendering logic as `StoreDetailModal` but as a standalone page (no modal overlay, no close button, has back navigation).

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SushiroStore, GroupQueue } from '../types';
import { getStoreStatusInfo, getTicketStatusInfo, formatGoogleMapsUrl, isStoreServicing } from '../utils/status';
import { RefreshCw, MapPin, ExternalLink, Info, Calculator, ArrowLeft } from 'lucide-react';
import { NotificationBell } from '../components/NotificationBell';

const SITE_URL = 'https://sushiro-hk-live.vercel.app';

export default function StorePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const storeId = parseInt(id || '0', 10);

  // Initialize from prerendered data if present (no loading flash on direct visits)
  const [store, setStore] = useState<SushiroStore | null>(() => {
    const prerendered = (window as any).__STORE_DATA__;
    return prerendered && prerendered.store && prerendered.store.id === storeId ? prerendered.store : null;
  });
  const [queue, setQueue] = useState<GroupQueue | null>(null);
  const [loading, setLoading] = useState(() => !store);
  const [queueLoading, setQueueLoading] = useState(true);
  const [myTicket, setMyTicket] = useState('');

  // Fetch store + queue in one call using existing /api/store/:id endpoint
  const fetchStoreData = useCallback(async (sid: number) => {
    setQueueLoading(true);
    try {
      const res = await fetch(`/api/store/${sid}`);
      const data = await res.json();
      if (data.success && data.store) {
        setStore(data.store);
        if (data.queue) setQueue(data.queue);
      }
    } catch (err) {
      console.warn('Failed to load store:', err);
    } finally {
      setLoading(false);
      setQueueLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!storeId) return;
    fetchStoreData(storeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  // Ticket calculator logic (same as StoreDetailModal)
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

  const parseQueueNum = (raw: string) => {
    const cleaned = raw.replace(/^#/, '');
    const parts = cleaned.split('-');
    const base = parseInt(parts[0], 10);
    const sub = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    return { raw: cleaned, base: isNaN(base) ? 0 : base, sub: isNaN(sub) ? 0 : sub, isReservation: !isNaN(base) && base >= 1000 };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100/70 dark:bg-slate-950">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#aa151b] mx-auto mb-4" />
          <p className="text-sm font-bold text-neutral-400">載入中...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100/70 dark:bg-slate-950">
        <div className="text-center">
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white mb-4">門市未找到</h1>
          <p className="text-sm text-neutral-400 mb-6">找不到 ID 為 {storeId} 的門市</p>
          <Link to="/" className="px-6 py-2.5 rounded-full bg-[#aa151b] text-white font-black text-xs uppercase tracking-wider">
            返回主頁
          </Link>
        </div>
      </div>
    );
  }

  const storeStatusInfo = getStoreStatusInfo(store.storeStatus);
  const ticketStatusInfo = getTicketStatusInfo(store.netTicketStatus, store.storeStatus, store.localTicketingStatus, store.wait, store.waitingGroup);
  const mapsUrl = formatGoogleMapsUrl(store.latitude, store.longitude, store.address, store.name);
  const isServicing = isStoreServicing(store);

  const boothNumbers = [...new Set([...(queue?.boothQueue || []), ...(queue?.storeBoothQueue || [])])];
  const counterNumbers = [...new Set([...(queue?.counterQueue || []), ...(queue?.storeCounterQueue || [])])];
  const storeNumbers = [...new Set([...(queue?.storeQueue || []), ...(queue?.mixedQueue || [])])];
  const allRawNums = [...new Set([...boothNumbers, ...counterNumbers, ...storeNumbers])]
    .map((n) => n.replace(/^#/, ''))
    .filter((n) => { const { base } = parseQueueNum(n); return !isNaN(base) && base > 0; });
  const parsedNums = allRawNums.map(parseQueueNum).sort((a, b) => {
    if (a.isReservation !== b.isReservation) return a.isReservation ? 1 : -1;
    return a.base - b.base || a.sub - b.sub;
  });
  const walkInNums = parsedNums.filter((n) => !n.isReservation);
  const maxCalledNum = walkInNums.length > 0 ? Math.max(...walkInNums.map((n) => n.base)) : 0;
  const hasNoQueue = walkInNums.length === 0 && parsedNums.length === 0;
  const recentNumbers = parsedNums.slice(0, 3);

  const myTicketNum = parseInt(myTicket, 10);
  let groupsAhead = 0;
  let estimatedMins = 0;
  let ticketValidationState: 'empty' | 'called' | 'valid' | 'far_future' = 'empty';
  let validationMessage = '';

  if (queueLoading) {
    validationMessage = '正在載入叫號資料…';
  } else if (!isServicing) {
    if (store.storeStatus !== 'OPEN') {
      validationMessage = '門市非營業中，籌號計算器暫停使用';
    } else {
      validationMessage = `門市${ticketStatusInfo.label}，籌號計算器暫停使用`;
    }
  } else if (hasNoQueue) {
    ticketValidationState = 'valid';
    validationMessage = '目前無輪候，可即時入座';
  } else if (!myTicket || isNaN(myTicketNum) || myTicketNum <= 0) {
    validationMessage = '請使用下方數字鍵盤輸入您手中的籌號';
  } else if (myTicketNum <= maxCalledNum) {
    ticketValidationState = 'called';
    validationMessage = `籌號 #${myTicketNum} 已於較早前叫號完畢，如錯過叫號請至門市櫃檯登記過期補號。`;
  } else if (myTicketNum - maxCalledNum > 350) {
    ticketValidationState = 'far_future';
    groupsAhead = myTicketNum - maxCalledNum;
    estimatedMins = Math.max(2, Math.round(groupsAhead * 1.3));
    validationMessage = `籌號 #${myTicketNum} 距離目前最新叫號 (#${maxCalledNum}) 相差較遠 (${groupsAhead} 組)，請核對籌號是否正確。`;
  } else {
    ticketValidationState = 'valid';
    groupsAhead = myTicketNum - maxCalledNum;
    estimatedMins = Math.max(2, Math.round(groupsAhead * 1.35));
    validationMessage = `正常輪候中：前面尚有 ${groupsAhead} 組，預估等待約 ${estimatedMins} 分鐘。`;
  }

  // Update document meta tags for SEO
  useEffect(() => {
    document.title = `壽司郎 ${store.name} - 即時等候時間 | 壽司郎 HK Live`;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        if (name.startsWith('og:')) {
          el.setAttribute('property', name);
        } else {
          el.setAttribute('name', name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const desc = `壽司郎 ${store.name} (${store.nameEn}) 即時等候時間：${store.wait} 分鐘，${store.waitingGroup} 組輪候中。地址：${store.address}`;
    setMeta('description', desc);
    setMeta('og:title', `壽司郎 ${store.name} - 即時等候時間 | 壽司郎 HK Live`);
    setMeta('og:description', desc);
    setMeta('og:url', `${SITE_URL}/store/${store.id}`);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${SITE_URL}/store/${store.id}`);
  }, [store]);

  // Structured data
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: store.name,
      alternateName: store.nameEn,
      address: {
        '@type': 'PostalAddress',
        streetAddress: store.address,
        addressLocality: 'Hong Kong',
        addressRegion: store.area,
        addressCountry: 'HK',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: store.latitude,
        longitude: store.longitude,
      },
      url: `${SITE_URL}/store/${store.id}`,
      sameAs: 'https://www.sushiro.com.hk/',
      servesCuisine: 'Japanese',
      priceRange: '$$',
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    script.id = 'store-structured-data';
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [store]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Header */}
      <div className="shrink-0 p-4 sm:p-6 bg-[#141414] text-white relative border-b-4 border-[#aa151b]">
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-all cursor-pointer active:scale-90"
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute top-4 right-4 z-10">
          <Link
            to="/"
            className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-all inline-flex active:scale-90"
            aria-label="返回主頁"
          >
            <span className="text-xs font-bold px-1">主頁</span>
          </Link>
        </div>

        <div className="pt-10">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-white">{store.name}</h1>
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
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-white hover:text-[#aa151b] bg-neutral-800 hover:bg-neutral-700 px-2.5 py-0.5 transition-colors">
              <ExternalLink className="w-3 h-3" />
              <span>GOOGLE 地圖</span>
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {/* Latest Calling Numbers */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 rounded-t-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-tight">最新叫號</span>
            <button onClick={() => fetchStoreData(storeId)} disabled={queueLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-black uppercase transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700">
              <RefreshCw className={`w-3 h-3 ${queueLoading ? 'animate-spin text-[#aa151b]' : ''}`} />
              <span>更新</span>
            </button>
          </div>
          {queueLoading ? (
            <div className="flex items-center justify-center gap-2 py-3">
              <RefreshCw className="w-4 h-4 animate-spin text-[#aa151b]" />
              <span className="text-sm font-bold text-neutral-400">載入中...</span>
            </div>
          ) : recentNumbers.length > 0 ? (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {recentNumbers.map((num, idx) => (
                <div key={num.raw} className="flex items-center gap-3">
                  <span className={`text-2xl sm:text-3xl font-black tabular-nums ${idx === 0 ? 'text-[#aa151b]' : 'text-neutral-900 dark:text-white'}`}>
                    #{num.raw}
                    {num.isReservation && <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 ml-1">(預約)</span>}
                  </span>
                  {idx < recentNumbers.length - 1 && <span className="text-neutral-300 dark:text-neutral-600 text-lg">→</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-neutral-400 font-bold text-sm py-2">
              {isServicing ? '暫無叫號資料' : '門市非營業中'}
            </div>
          )}
        </div>

        {/* Ticket Calculator */}
        <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-3">
            <Calculator className="w-4 h-4 text-[#aa151b]" />
            <span>籌號計算器</span>
          </h3>

          <div className={`mb-4 p-3 rounded-md border text-xs font-bold flex items-center gap-2 transition-all ${
            ticketValidationState === 'called' ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
            : ticketValidationState === 'far_future' ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
            : ticketValidationState === 'valid' ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
          }`}>
            <Info className="w-4 h-4 shrink-0" />
            <span>{validationMessage}</span>
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
                  <button key={k} disabled={!isServicing} onClick={() => handleNumpad(k)}
                    className={`py-2 rounded-md border text-center transition-all font-black text-sm ${!isServicing ? 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-450 cursor-not-allowed opacity-50' : k === 'del' || k === 'clear' ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 active:scale-95' : 'bg-neutral-50 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white active:scale-95'}`}>
                    {k === 'del' ? '⌫ 刪除' : k === 'clear' ? 'C 清除' : k}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 justify-between">
              <div className={`border-2 rounded-lg p-4 text-center flex-1 flex flex-col items-center justify-center min-h-[90px] ${ticketValidationState === 'called' ? 'bg-red-50 border-red-300 dark:bg-red-950/40 dark:border-red-800' : hasNoQueue && ticketValidationState === 'valid' ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800' : 'bg-white dark:bg-neutral-800 border-[#aa151b]'}`}>
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">輪候進度</span>
                <span className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                  {ticketValidationState === 'empty' ? '請輸入籌號' : ticketValidationState === 'called' ? '已過號 / 即時入座' : hasNoQueue && ticketValidationState === 'valid' ? '即時入座' : `尚有 ${groupsAhead} 組`}
                </span>
              </div>
              <div className={`border-2 rounded-lg p-4 text-center flex-1 flex flex-col items-center justify-center min-h-[90px] ${hasNoQueue && ticketValidationState === 'valid' ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800' : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'}`}>
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">預估等候時間</span>
                <span className={`text-2xl sm:text-3xl font-black ${hasNoQueue && ticketValidationState === 'valid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#aa151b]'}`}>
                  {ticketValidationState === 'empty' ? '-- 分鐘' : ticketValidationState === 'called' ? '即刻前往櫃檯' : hasNoQueue && ticketValidationState === 'valid' ? '約0分鐘' : `約 ${estimatedMins} 分鐘`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Bell */}
        {ticketValidationState === 'valid' && groupsAhead > 0 && (
          <div className="px-5 py-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-b-xl">
            <NotificationBell storeId={store.id} ticketNumber={myTicketNum} groupsAhead={groupsAhead} onToast={() => {}} />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds. StorePage is lazy-loaded and only referenced from main.tsx (no App.tsx changes needed).

- [ ] **Step 3: Commit**

```bash
git add src/pages/StorePage.tsx
git commit -m "feat: add StorePage component with meta tags and structured data"
```

---

## Task 3: Create Build Script for Prerendering + Sitemap

**Files:**
- Create: `scripts/build-seo.ts`
- Modify: `package.json` (add `build:seo` script)

**Interfaces:**
- Consumes: upstream Sushiro API store list
- Produces: `dist/store/{id}.html` files, `dist/sitemap.xml`

- [ ] **Step 1: Create the build script**

Create `scripts/build-seo.ts`:

```ts
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SITE_URL = 'https://sushiro-hk-live.vercel.app';
const UPSTREAM_API = 'https://sushipass.sushiro.com.hk/api/2.0/info/storelist?latitude=22&longitude=114&numresults=100&region=HK';
const DIST_DIR = join(import.meta.dirname, '..', 'dist');
const INDEX_HTML = join(DIST_DIR, 'index.html');

interface Store {
  id: number;
  name: string;
  nameEn: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  wait: number;
  waitingGroup: number;
  storeStatus: string;
  netTicketStatus: string;
  localTicketingStatus: string;
  waitTimeCap: number;
}

async function fetchStores(): Promise<Store[]> {
  const res = await fetch(UPSTREAM_API);
  if (!res.ok) throw new Error(`Upstream API error: ${res.status}`);
  const data = await res.json();
  return data.stores || [];
}

function generateStoreHTML(baseHTML: string, store: Store): string {
  // Inject meta tags into <head>
  const title = `壽司郎 ${store.name} - 即時等候時間 | 壽司郎 HK Live`;
  const description = `壽司郎 ${store.name} (${store.nameEn}) 即時等候時間：${store.wait} 分鐘，${store.waitingGroup} 組輪候中。地址：${store.address}`;
  const url = `${SITE_URL}/store/${store.id}`;

  const metaTags = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: store.name,
    alternateName: store.nameEn,
    address: {
      '@type': 'PostalAddress',
      streetAddress: store.address,
      addressLocality: 'Hong Kong',
      addressRegion: store.area,
      addressCountry: 'HK',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: store.latitude,
      longitude: store.longitude,
    },
    url,
    sameAs: 'https://www.sushiro.com.hk/',
    servesCuisine: 'Japanese',
    priceRange: '$$',
  };

  const dataScript = `<script>window.__STORE_DATA__ = ${JSON.stringify({ store })};</script>`;
  const structuredScript = `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;

  // Insert meta tags and scripts before </head>
  let html = baseHTML
    .replace(/<title>.*?<\/title>/s, '')
    .replace(/<meta name="description".*?\/>/s, '')
    .replace(/<link rel="canonical".*?\/>/s, '')
    .replace(/<meta property="og:title".*?\/>/s, '')
    .replace(/<meta property="og:description".*?\/>/s, '')
    .replace(/<meta property="og:url".*?\/>/s, '')
    .replace('</head>', `${metaTags}\n    ${structuredScript}\n    ${dataScript}\n  </head>`);

  // Update canonical URL
  if (!html.includes('<link rel="canonical"')) {
    html = html.replace('</head>', `    <link rel="canonical" href="${url}" />\n  </head>`);
  }

  return html;
}

function generateSitemap(stores: Store[]): string {
  const today = new Date().toISOString().split('T')[0];
  const urls = stores.map((s) => `  <url>
    <loc>${SITE_URL}/store/${s.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>always</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
${urls}
</urlset>`;
}

async function main() {
  console.log('🔍 Fetching store list from upstream API...');
  const stores = await fetchStores();
  console.log(`✅ Fetched ${stores.length} stores`);

  // Read base index.html from dist (after Vite build)
  if (!existsSync(INDEX_HTML)) {
    console.error('❌ dist/index.html not found. Run `npm run build` first.');
    process.exit(1);
  }
  const baseHTML = readFileSync(INDEX_HTML, 'utf-8');

  // Generate store pages
  console.log('📄 Generating store pages...');
  for (const store of stores) {
    const storeDir = join(DIST_DIR, 'store');
    mkdirSync(storeDir, { recursive: true });

    const html = generateStoreHTML(baseHTML, store);
    writeFileSync(join(storeDir, `${store.id}.html`), html, 'utf-8');
  }
  console.log(`✅ Generated ${stores.length} store pages`);

  // Generate sitemap
  console.log('🗺️  Generating sitemap...');
  const sitemap = generateSitemap(stores);
  writeFileSync(join(DIST_DIR, 'sitemap.xml'), sitemap, 'utf-8');
  console.log('✅ Sitemap generated');

  // Also update public/sitemap.xml as source
  const publicDir = join(import.meta.dirname, '..', 'public');
  writeFileSync(join(publicDir, 'sitemap.xml'), sitemap, 'utf-8');
  console.log('✅ Updated public/sitemap.xml');
}

main().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Add build:seo script to package.json**

Add to `scripts` in `package.json`:

```json
"build:seo": "npm run build && node --experimental-strip-types scripts/build-seo.ts"
```

- [ ] **Step 3: Verify the build works end-to-end**

Run: `npm run build:seo`
Expected: Build succeeds, `dist/store/` directory created with HTML files, `dist/sitemap.xml` generated.

- [ ] **Step 4: Verify a store page has correct content**

Run: `cat dist/store/1.html | head -50`
Expected: HTML with `<title>` containing store name, `<meta name="description">`, JSON-LD structured data, and `window.__STORE_DATA__`.

- [ ] **Step 5: Verify sitemap**

Run: `cat dist/sitemap.xml`
Expected: XML with `<url>` entries for `/` and all 44 stores.

- [ ] **Step 6: Commit**

```bash
git add scripts/build-seo.ts package.json public/sitemap.xml
git commit -m "feat: add SEO build script for prerendering and sitemap"
```

---

## Task 4: Add WebSite Structured Data to Main Page

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: existing `WebApplication` JSON-LD in index.html
- Produces: additional `WebSite` + `SearchAction` structured data

- [ ] **Step 1: Add WebSite schema to index.html**

Edit `index.html` — add a second `<script type="application/ld+json">` block after the existing `WebApplication` schema:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "壽司郎 HK Live Queue",
  "url": "https://sushiro-hk-live.vercel.app/",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://sushiro-hk-live.vercel.app/?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>
```

- [ ] **Step 2: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add WebSite structured data with SearchAction"
```

---

## Task 5: Update Vercel Config for SPA Fallback

**Files:**
- Modify: `vercel.json`

**Interfaces:**
- Consumes: prerendered `/store/{id}.html` files in `dist/`
- Produces: Vercel serves prerendered HTML for `/store/:id`

**Why this works:** Vercel serves static files (from `dist/`) **before** rewrites. So:
- `/assets/*.js`, `/icon.svg`, `/manifest.json` → served directly (real files, never rewritten)
- `/store/123` → no such file → rewrite matches → serves `/store/123.html`
- `/` → serves `index.html` directly
- `/api/*` → serverless functions (matched before rewrites)
- The SPA lives entirely at `/` (state-based tabs), so **no catch-all rewrite is needed** — it can't break asset serving

- [ ] **Step 1: Add store page rewrite**

Edit `vercel.json` — add a single rewrite so `/store/:id` serves the prerendered HTML. Add `build:seo` as the build command:

```json
{
  "buildCommand": "npm run build:seo",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/store/:id", "destination": "/store/:id.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

- [ ] **Step 2: Verify build produces store pages**

Run: `npm run build:seo && ls dist/store/ | head -5`
Expected: `dist/store/` contains `1.html`, `2.html`, etc.

- [ ] **Step 3: Preview locally**

Run: `npx vite preview`
Visit: `http://localhost:4173/store/1.html`
Expected: prerendered store page loads with correct title and meta tags.

Note: `vite preview` serves static files, so visit the `.html` path directly. Vercel's clean URL `/store/1` → `/store/1.html` is tested only after deploy. Deploy a preview with `npx vercel` to confirm.

- [ ] **Step 4: Commit**

```bash
git add vercel.json
git commit -m "feat: configure Vercel to serve prerendered store pages"
```

---

## Task 6: Verify Everything Works

- [ ] **Step 1: Full build**

Run: `npm run build:seo`
Expected: Clean build with no errors.

- [ ] **Step 2: Check prerendered store pages exist**

Run: `ls dist/store/ | wc -l`
Expected: 44 files (one per store).

- [ ] **Step 3: Check a store page has meta tags**

Run: `grep -o '<title>.*</title>' dist/store/1.html`
Expected: `<title>壽司郎 [store name] - 即時等候時間 | 壽司郎 HK Live</title>`

- [ ] **Step 4: Check structured data exists**

Run: `grep 'application/ld+json' dist/store/1.html | head -1`
Expected: JSON-LD block with `Restaurant` type.

- [ ] **Step 5: Check sitemap has all stores**

Run: `grep '<loc>' dist/sitemap.xml | wc -l`
Expected: 45 lines (1 main page + 44 stores).

- [ ] **Step 6: Run type check**

Run: `npm run lint`
Expected: No TypeScript errors.

- [ ] **Step 7: Run tests**

Run: `npm test`
Expected: All existing tests pass.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: complete SEO optimization — routing, prerendering, sitemap, structured data, meta tags"
```
