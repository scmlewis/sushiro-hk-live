# Google Maps Busyness Data — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google Maps busyness data (live occupancy + historical popular times) to the store detail modal, fetched via a server-side Vercel function with 30-minute caching.

**Architecture:** New `/api/busyness` Vercel serverless function resolves Sushiro stores to Google Places via `findPlaceFromQuery`, fetches `currentOpeningHours` and `popularTimes` via `getDetails`, and caches results for 30 minutes. Client-side `BusynessChart` and `LiveBusynessBadge` components render the data in the existing `StoreDetailModal`.

**Tech Stack:** Google Maps Places API (New), Vercel Serverless Functions, React, Recharts, Vitest, Tailwind CSS

## Global Constraints

- API key stored in `GOOGLE_MAPS_API_KEY` env var, never exposed client-side
- Graceful degradation: if API key missing or Google returns no data, busyness section is hidden
- 30-minute TTL cache in server memory (same pattern as `api/_lib/cache.ts`)
- Store metadata (name, lat, lng) passed from client as query params — no hardcoded store list on server
- All UI text in Traditional Chinese
- Follow existing code patterns: Vercel handler envelope `{ success, data, cached, stale, timestamp }`, `CacheEntry<T>` interface, Tailwind dark mode, `motion/react` animations
- Color scheme: `#aa151b` (brand red), `#141414` (dark bg)

---

### Task 1: Add Busyness Types

**Files:**
- Modify: `src/types.ts`

**Interfaces:**
- Produces: `BusynessData`, `PopularTimesHour`, `BusynessApiResponse` types used by Tasks 2-6

- [ ] **Step 1: Add busyness types to `src/types.ts`**

Add the following types at the end of the file:

```typescript
export interface PopularTimesHour {
  hour: number;       // 0-23
  busy: number;       // 0-100
}

export interface BusynessData {
  live: number | null;                    // 0-100, current occupancy vs typical
  popularTimes: PopularTimesHour[] | null; // 24 entries, one per hour
  currentHour: number;                     // 0-23, HK timezone
}

export interface BusynessApiResponse {
  success: boolean;
  busyness: BusynessData | null;
  cached: boolean;
  timestamp: number;
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no type errors)

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add busyness data types"
```

---

### Task 2: Create Busyness Cache Module

**Files:**
- Create: `api/_lib/busyness-cache.ts`

**Interfaces:**
- Consumes: None (standalone module)
- Produces: `getBusynessData(storeId, storeName, lat, lng, forceFresh?)` function used by Task 3

- [ ] **Step 1: Create `api/_lib/busyness-cache.ts`**

```typescript
import type { BusynessData, PopularTimesHour } from '../../src/types.js';

interface BusynessCacheEntry {
  data: BusynessData | null;
  timestamp: number;
  placeId?: string;
}

const BUSYNESS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const busynessCache = new Map<string, BusynessCacheEntry>();

function getApiKey(): string | undefined {
  return process.env.GOOGLE_MAPS_API_KEY;
}

function getHkHour(): number {
  const now = new Date();
  const hkTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }));
  return hkTime.getHours();
}

async function findPlaceId(
  storeName: string,
  lat: number,
  lng: number,
  apiKey: string
): Promise<string | null> {
  const query = encodeURIComponent(`壽司郎 ${storeName}`);
  const url = `https://places.googleapis.com/v1/places:searchText?fields=id&key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      textQuery: `壽司郎 ${storeName}`,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 5000.0,
        },
      },
      maxResultCount: 1,
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.places?.[0]?.id ?? null;
}

async function getPlaceBusyness(
  placeId: string,
  apiKey: string
): Promise<{ live: number | null; popularTimes: PopularTimesHour[] | null }> {
  const fields = 'currentOpeningHours,popularTimes';
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?fields=${fields}&key=${apiKey}`;

  const res = await fetch(url);

  if (!res.ok) return { live: null, popularTimes: null };

  const data = await res.json();

  // Extract live busyness
  let live: number | null = null;
  if (data.currentOpeningHours?.busyNow !== undefined) {
    live = data.currentOpeningHours.busyNow;
  }

  // Extract popular times
  let popularTimes: PopularTimesHour[] | null = null;
  if (data.popularTimes && Array.isArray(data.popularTimes)) {
    const today = new Date().getDay(); // 0=Sunday
    const todayData = data.popularTimes[today];
    if (todayData?.hours && Array.isArray(todayData.hours)) {
      popularTimes = todayData.hours.map((h: any) => ({
        hour: h.hour ?? 0,
        busy: h.busy ?? 0,
      }));
    }
  }

  return { live, popularTimes };
}

export async function getBusynessData(
  storeId: number,
  storeName: string,
  lat: number,
  lng: number,
  forceFresh = false
): Promise<{ data: BusynessData | null; cached: boolean; timestamp: number }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { data: null, cached: false, timestamp: Date.now() };
  }

  const cacheKey = `busyness_${storeId}`;
  const cached = busynessCache.get(cacheKey);

  if (!forceFresh && cached && Date.now() - cached.timestamp < BUSYNESS_CACHE_TTL) {
    return { data: cached.data, cached: true, timestamp: cached.timestamp };
  }

  try {
    // Step 1: Find or reuse Place ID
    let placeId = cached?.placeId;
    if (!placeId) {
      placeId = await findPlaceId(storeName, lat, lng, apiKey) ?? undefined;
      if (!placeId) {
        const entry: BusynessCacheEntry = { data: null, timestamp: Date.now() };
        busynessCache.set(cacheKey, entry);
        return { data: null, cached: false, timestamp: entry.timestamp };
      }
    }

    // Step 2: Fetch busyness data
    const { live, popularTimes } = await getPlaceBusyness(placeId, apiKey);

    const busynessData: BusynessData = {
      live,
      popularTimes,
      currentHour: getHkHour(),
    };

    const entry: BusynessCacheEntry = {
      data: busynessData,
      timestamp: Date.now(),
      placeId,
    };
    busynessCache.set(cacheKey, entry);

    return { data: busynessData, cached: false, timestamp: entry.timestamp };
  } catch {
    // On error, return stale data if available, else null
    if (cached) {
      return { data: cached.data, cached: true, timestamp: cached.timestamp };
    }
    return { data: null, cached: false, timestamp: Date.now() };
  }
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add api/_lib/busyness-cache.ts
git commit -m "feat: add busyness cache module with Google Places API integration"
```

---

### Task 3: Create `/api/busyness` Endpoint

**Files:**
- Create: `api/busyness.ts`

**Interfaces:**
- Consumes: `getBusynessData()` from Task 2
- Produces: `GET /api/busyness?storeid=<id>&name=<name>&lat=<lat>&lng=<lng>` endpoint used by Task 6

- [ ] **Step 1: Create `api/busyness.ts`**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBusynessData } from './_lib/busyness-cache.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const storeId = Number(req.query.storeid);
  const name = req.query.name as string;
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (!storeId || !name || isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ success: false, error: '缺少必要參數 (storeid, name, lat, lng)' });
  }

  try {
    const force = req.query.force === 'true';
    const result = await getBusynessData(storeId, name, lat, lng, force);

    return res.json({
      success: true,
      busyness: result.data,
      cached: result.cached,
      timestamp: result.timestamp,
    });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      error: '無法取得人流資料',
      details: err.message,
    });
  }
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add api/busyness.ts
git commit -m "feat: add /api/busyness endpoint for Google Maps busyness data"
```

---

### Task 4: Create BusynessChart Component

**Files:**
- Create: `src/components/BusynessChart.tsx`
- Create: `src/components/BusynessChart.test.tsx`

**Interfaces:**
- Consumes: `PopularTimesHour[]` type from Task 1
- Produces: `<BusynessChart popularTimes={...} currentHour={...} />` used by Task 6

- [ ] **Step 1: Write the failing test**

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BusynessChart } from './BusynessChart';
import type { PopularTimesHour } from '../types';

describe('BusynessChart', () => {
  const mockPopularTimes: PopularTimesHour[] = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    busy: i >= 11 && i <= 20 ? 50 + Math.random() * 40 : 10 + Math.random() * 20,
  }));

  it('renders the chart title', () => {
    render(<BusynessChart popularTimes={mockPopularTimes} currentHour={14} />);
    expect(screen.getByText('今日人流')).toBeInTheDocument();
  });

  it('renders hour labels', () => {
    render(<BusynessChart popularTimes={mockPopularTimes} currentHour={14} />);
    expect(screen.getByText('11:00')).toBeInTheDocument();
    expect(screen.getByText('20:00')).toBeInTheDocument();
  });

  it('renders "currently not busy" message when live is null', () => {
    render(<BusynessChart popularTimes={mockPopularTimes} currentHour={14} />);
    expect(screen.getByText('今日人流')).toBeInTheDocument();
  });

  it('does not render when popularTimes is null', () => {
    const { container } = render(<BusynessChart popularTimes={null} currentHour={14} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/BusynessChart.test.tsx`
Expected: FAIL — `BusynessChart` not defined

- [ ] **Step 3: Write `src/components/BusynessChart.tsx`**

```typescript
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import type { PopularTimesHour } from '../types';

interface BusynessChartProps {
  popularTimes: PopularTimesHour[] | null;
  currentHour: number;
}

const getBarColor = (hour: number, currentHour: number, busy: number): string => {
  if (hour < currentHour) return '#d4d4d4'; // past: neutral-300
  if (hour === currentHour) return '#aa151b'; // current: brand red
  // future: opacity based on expected busyness
  if (busy >= 75) return '#aa151b';
  if (busy >= 50) return '#f97316';
  if (busy >= 25) return '#eab308';
  return '#10b981';
};

const getDarkBarColor = (hour: number, currentHour: number, busy: number): string => {
  if (hour < currentHour) return '#525252'; // past: neutral-600
  if (hour === currentHour) return '#aa151b'; // current: brand red
  // future: opacity based on expected busyness
  if (busy >= 75) return '#aa151b';
  if (busy >= 50) return '#f97316';
  if (busy >= 25) return '#eab308';
  return '#10b981';
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const hour = payload[0].payload.hour;
    const busy = payload[0].value;
    return (
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-3 py-1.5 shadow-lg">
        <p className="text-xs font-bold text-neutral-900 dark:text-white">
          {`${String(hour).padStart(2, '0')}:00 — ${busy}%`}
        </p>
      </div>
    );
  }
  return null;
};

export const BusynessChart: React.FC<BusynessChartProps> = ({ popularTimes, currentHour }) => {
  if (!popularTimes || popularTimes.length === 0) return null;

  // Show only hours 10-22 (Sushiro operating hours)
  const filteredData = popularTimes
    .filter((h) => h.hour >= 10 && h.hour <= 22)
    .map((h) => ({
      ...h,
      label: `${String(h.hour).padStart(2, '0')}:00`,
    }));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-tight">
          今日人流
        </span>
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
          資料來源：Google
        </span>
      </div>

      <div className="w-full h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#a3a3a3', fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis
              domain={[0, 100]}
              tick={false}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="busy" radius={[2, 2, 0, 0]} maxBarSize={20}>
              {filteredData.map((entry) => (
                <Cell
                  key={entry.hour}
                  className="dark:hidden"
                  fill={getBarColor(entry.hour, currentHour, entry.busy)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#aa151b]" />
          <span className="text-[10px] font-bold text-neutral-500">目前時段</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-neutral-300 dark:bg-neutral-600" />
          <span className="text-[10px] font-bold text-neutral-500">已過時段</span>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/BusynessChart.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/BusynessChart.tsx src/components/BusynessChart.test.tsx
git commit -m "feat: add BusynessChart component with popular times bar chart"
```

---

### Task 5: Create LiveBusynessBadge Component

**Files:**
- Create: `src/components/LiveBusynessBadge.tsx`
- Create: `src/components/LiveBusynessBadge.test.tsx`

**Interfaces:**
- Consumes: `number | null` (live busyness percentage) from Task 1
- Produces: `<LiveBusynessBadge live={...} />` used by Task 6

- [ ] **Step 1: Write the failing test**

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LiveBusynessBadge } from './LiveBusynessBadge';

describe('LiveBusynessBadge', () => {
  it('renders quiet state', () => {
    render(<LiveBusynessBadge live={15} />);
    expect(screen.getByText('目前人流')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('清靜')).toBeInTheDocument();
  });

  it('renders moderate state', () => {
    render(<LiveBusynessBadge live={40} />);
    expect(screen.getByText('適中')).toBeInTheDocument();
  });

  it('renders busy state', () => {
    render(<LiveBusynessBadge live={60} />);
    expect(screen.getByText('繁忙')).toBeInTheDocument();
  });

  it('renders very busy state', () => {
    render(<LiveBusynessBadge live={85} />);
    expect(screen.getByText('非常繁忙')).toBeInTheDocument();
  });

  it('does not render when live is null', () => {
    const { container } = render(<LiveBusynessBadge live={null} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/LiveBusynessBadge.test.tsx`
Expected: FAIL — `LiveBusynessBadge` not defined

- [ ] **Step 3: Write `src/components/LiveBusynessBadge.tsx`**

```typescript
import React from 'react';

interface LiveBusynessBadgeProps {
  live: number | null;
}

const getBusynessLevel = (live: number): { label: string; color: string; bgColor: string; borderColor: string } => {
  if (live >= 75) return {
    label: '非常繁忙',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-950/60',
    borderColor: 'border-red-300 dark:border-red-800',
  };
  if (live >= 50) return {
    label: '繁忙',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-50 dark:bg-orange-950/60',
    borderColor: 'border-orange-300 dark:border-orange-800',
  };
  if (live >= 25) return {
    label: '適中',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/60',
    borderColor: 'border-yellow-300 dark:border-yellow-800',
  };
  return {
    label: '清靜',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
    borderColor: 'border-emerald-300 dark:border-emerald-800',
  };
};

export const LiveBusynessBadge: React.FC<LiveBusynessBadgeProps> = ({ live }) => {
  if (live === null || live === undefined) return null;

  const level = getBusynessLevel(live);

  return (
    <div className={`flex items-center justify-between p-3 rounded-md border ${level.bgColor} ${level.borderColor}`}>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-black ${level.color}`}>
          目前人流
        </span>
        <span className={`text-xs font-bold ${level.color} opacity-70`}>
          {level.label}
        </span>
      </div>
      <span className={`text-lg font-black tabular-nums ${level.color}`}>
        {live}%
      </span>
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/LiveBusynessBadge.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/LiveBusynessBadge.tsx src/components/LiveBusynessBadge.test.tsx
git commit -m "feat: add LiveBusynessBadge component for real-time busyness display"
```

---

### Task 6: Integrate Busyness into StoreDetailModal

**Files:**
- Modify: `src/components/StoreDetailModal.tsx`
- Modify: `src/components/StoreDetailModal.test.tsx`

**Interfaces:**
- Consumes: `BusynessChart` from Task 4, `LiveBusynessBadge` from Task 5, `BusynessData` / `BusynessApiResponse` types from Task 1
- Produces: Busyness section visible in the store detail modal

- [ ] **Step 1: Add state and fetch logic to `StoreDetailModal.tsx`**

Add the following imports at the top of `StoreDetailModal.tsx`:

```typescript
import { BusynessChart } from './BusynessChart';
import { LiveBusynessBadge } from './LiveBusynessBadge';
import type { BusynessData } from '../types';
```

Add state inside the component, after the existing `myTicket` state (around line 26):

```typescript
const [busyness, setBusyness] = useState<BusynessData | null>(null);
const [busynessLoading, setBusynessLoading] = useState(false);
```

Add effect to fetch busyness when store changes, after the existing `useEffect` for `setMyTicket` (around line 30):

```typescript
useEffect(() => {
  if (!store) {
    setBusyness(null);
    return;
  }

  setBusynessLoading(true);
  const params = new URLSearchParams({
    storeid: String(store.id),
    name: store.name,
    lat: String(store.latitude),
    lng: String(store.longitude),
  });
  fetch(`/api/busyness?${params}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.busyness) {
        setBusyness(data.busyness);
      } else {
        setBusyness(null);
      }
    })
    .catch(() => setBusyness(null))
    .finally(() => setBusynessLoading(false));
}, [store?.id]);
```

- [ ] **Step 2: Add busyness section to modal JSX**

Add the following JSX block **after** the "Ticket Calculator Keypad" section (after line 380, before the closing `</div>` of the scrollable content area):

```typescript
{/* Busyness Data from Google Maps */}
{(busynessLoading || (busyness && (busyness.live !== null || busyness.popularTimes))) && (
  <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
    {busynessLoading ? (
      <div className="space-y-3">
        <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        <div className="h-40 w-full bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
      </div>
    ) : busyness ? (
      <div className="space-y-4">
        {busyness.live !== null && (
          <LiveBusynessBadge live={busyness.live} />
        )}
        {busyness.popularTimes && (
          <BusynessChart
            popularTimes={busyness.popularTimes}
            currentHour={busyness.currentHour}
          />
        )}
      </div>
    ) : null}
  </div>
)}
```

- [ ] **Step 3: Update StoreDetailModal tests**

Add to existing test file `src/components/StoreDetailModal.test.tsx`:

Add mock fetch for busyness data in the test setup. Add this mock pattern before each test or in the relevant test:

```typescript
// Mock busyness API response
vi.mock('../components/BusynessChart', () => ({
  BusynessChart: ({ popularTimes, currentHour }: any) => (
    <div data-testid="busyness-chart">
      {popularTimes ? `Chart with ${popularTimes.length} hours` : 'No data'}
    </div>
  ),
}));

vi.mock('../components/LiveBusynessBadge', () => ({
  LiveBusynessBadge: ({ live }: any) => (
    <div data-testid="live-busyness-badge">
      {live !== null ? `Live: ${live}%` : 'No data'}
    </div>
  ),
}));
```

Add test case:

```typescript
it('fetches and displays busyness data when store is selected', async () => {
  const mockBusyness = {
    success: true,
    busyness: {
      live: 65,
      popularTimes: Array.from({ length: 24 }, (_, i) => ({ hour: i, busy: 50 })),
      currentHour: 14,
    },
  };

  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(mockBusyness),
  }) as any;

  render(
    <StoreDetailModal
      store={mockStore}
      queue={null}
      loading={false}
      isBookmarked={false}
      onClose={vi.fn()}
      onRefreshQueue={vi.fn()}
      onToggleBookmark={vi.fn()}
    />
  );

  await waitFor(() => {
    expect(screen.getByTestId('live-busyness-badge')).toBeInTheDocument();
    expect(screen.getByTestId('busyness-chart')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/StoreDetailModal.tsx src/components/StoreDetailModal.test.tsx
git commit -m "feat: integrate busyness data into StoreDetailModal"
```

---

### Task 7: Update Environment Configuration

**Files:**
- Modify: `.env.example`

**Interfaces:**
- Consumes: None
- Produces: Environment variable documented for deployment

- [ ] **Step 1: Add `GOOGLE_MAPS_API_KEY` to `.env.example`**

Add the following to the end of `.env.example`:

```

# GOOGLE_MAPS_API_KEY: Optional. Enables busyness data from Google Maps.
# Requires "Places API (New)" enabled in Google Cloud Console.
# Restrict key to your deployment domain.
# If not set, the busyness feature is hidden.
GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add GOOGLE_MAPS_API_KEY to .env.example"
```

---

### Task 8: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 3: Run lint (if configured)**

Run: `npx eslint src/ api/ --ext .ts,.tsx`
Expected: No errors

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds

---

## Summary

| Task | Files | Description |
|------|-------|-------------|
| 1 | `src/types.ts` | Add `BusynessData`, `PopularTimesHour`, `BusynessApiResponse` types |
| 2 | `api/_lib/busyness-cache.ts` | Google Places API integration + 30-min cache |
| 3 | `api/busyness.ts` | Vercel serverless endpoint |
| 4 | `src/components/BusynessChart.tsx` | Popular times bar chart (Recharts) |
| 5 | `src/components/LiveBusynessBadge.tsx` | Live busyness indicator badge |
| 6 | `src/components/StoreDetailModal.tsx` | Integration into modal with fetch + display |
| 7 | `.env.example` | Document `GOOGLE_MAPS_API_KEY` |
| 8 | — | Final typecheck, test, lint, build verification |
