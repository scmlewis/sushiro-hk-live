<div align="center">

# 壽司郎 HK Live Queue

**即時追蹤香港全港 44 間壽司郎門市之籌號發放、輪候組數與預估等候時間**

Real-time queue tracking for all 44 Sushiro locations across Hong Kong.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/scmlewis/sushiro-hk-live)

[![Live Demo](https://img.shields.io/badge/Live_Demo-sushiro--hk--live.vercel.app-blue?style=for-the-badge)](https://sushiro-hk-live.vercel.app/)

</div>

---

---

## Why this exists

Deciding which Sushiro to walk into used to mean guessing and queuing blind. This app pulls live ticket-issue and waiting-list numbers for every Hong Kong store so you can pick the one that seats you fastest — a small real-time data problem with an immediately useful answer.

## 功能一覽 / Features

### 全港門市即時列表 / Live Store Directory
收錄全港 44 間壽司郎門市，每間顯示營業狀態、籌號派發狀態、預估等候時間與輪候組數。支援按地區篩選（港島 / 九龍 / 新界）及關鍵字搜尋。

All 44 Sushiro HK stores with live status, ticket issuance, estimated wait time, and queue count. Filter by region (HK Island / Kowloon / NT) or search by name/address.

### 即時地圖 / Interactive Map View
全屏 Leaflet 互動地圖，以顏色區分等候時間（藍色=即時、綠色<15分鐘、黃色<30分鐘、橙色<60分鐘、紅色>=60分鐘）。支援.Marker 聚合、使用者定位與地圖圖例。

Full-screen Leaflet map with color-coded markers by wait time. Supports marker clustering, user location, and a map legend overlay.

### 推送通知 / Push Notifications
訂閱指定門市及籌號，系統每 5 分鐘自動檢查叫號進度。當您的籌號接近或被叫到時，即時發送瀏覽器推送通知。

Subscribe to a store and ticket number. The system checks queue progress every 5 minutes and sends browser push notifications when your ticket is near or called.

### 我的關注門市 / Bookmarked Stores
點擊 ♥ 加入關注後，系統每 10 秒自動刷新該門市之即時叫號進度。

Bookmark stores for automatic 10-second polling of live queue data.

### 門市比對 / Store Comparison
同時選擇 2 至 4 間門市進行即時橫向比對，系統自動標示「最快開枱」與「最少組數」之分店。

Compare 2–4 stores side-by-side with automatic fastest/least-crowded badges.

### 籌號計算器 / Ticket Calculator
輸入您手上之籌號，系統根據現場最新叫號自動計算身前剩餘組數與預估等候時間。

Enter your ticket number to calculate groups ahead and estimated wait based on live calling progress.

### 價格計算器 / Fare Calculator
選擇壽司菜品，設定目標預算，系統自動計算含稅總額、剩餘金額，並推薦接近預算的菜品組合。

Select sushi items and set a target budget to calculate the total cost with tax, remaining budget, and suggested combinations.

### GPS 定位排序 / GPS Distance Sorting
授權地理位置後，自動計算各門市與您之直線距離，支援「距離最近」排序。

Enable GPS to sort stores by distance from your current location.

### PWA 離線支援 / Offline PWA
安裝為 Progressive Web App 後，透過 Service Worker 實現離線快取。

Install as a PWA for offline caching via Service Worker.

### 其他功能 / Additional Features
- 深色模式 / Dark mode (system preference)
- 字型大小設定 / Text size settings (S/M/L)
- SEO 優化（Open Graph、Twitter Cards、JSON-LD 結構化資料）
- 響應式設計，優先適配手機裝置 / Mobile-first responsive design
- 動畫過渡效果 / Animated transitions (Motion)

---

## 技術架構 / Tech Stack

| 層級 | 技術 |
|------|------|
| 前端 / Frontend | React 19 + TypeScript 5.8 + Tailwind CSS 4 |
| 建構 / Build | Vite 6 |
| 動畫 / Animation | Motion (Framer Motion) |
| 圖標 / Icons | Lucide React |
| 地圖 / Maps | Leaflet + React-Leaflet |
| 圖表 / Charts | Recharts |
| 後端 / Backend | Vercel Serverless Functions |
| 資料庫 / Database | Upstash Redis (REST API) |
| 推送通知 / Notifications | Web Push (VAPID) |
| 測試 / Testing | Vitest + Testing Library |
| 部署 / Deploy | Vercel |
| 資料來源 / Data Source | Sushiro SUSHI-PASS API (HK) |

---

## 本機開發 / Local Development

### 環境要求 / Prerequisites
- Node.js 18+
- npm

### 安裝 / Install

```bash
git clone https://github.com/scmlewis/sushiro-hk-live.git
cd sushiro-hk-live
npm install
```

### 開發 / Dev

```bash
npm run dev
```

### 測試 / Test

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### 類型檢查 / Type Check

```bash
npm run lint
```

### 建構 / Build

```bash
npm run build
```

---

## 環境變數 / Environment Variables

推送通知功能需要以下環境變數。核心應用在無這些變數時仍可正常運作。

The push notification feature requires the following environment variables. The core app works without them.

| 變數 / Variable | 用途 / Purpose | 必要 / Required |
|---|---|---|
| `KV_REST_API_URL` | Upstash Redis REST URL | 是（通知）/ Yes (notifications) |
| `KV_REST_API_TOKEN` | Upstash Redis auth token | 是（通知）/ Yes (notifications) |
| `VAPID_PUBLIC_KEY` | Web Push VAPID public key | 是（通知）/ Yes (notifications) |
| `VAPID_PRIVATE_KEY` | Web Push VAPID private key | 是（通知）/ Yes (notifications) |
| `VAPID_EMAIL` | Contact email for VAPID (`mailto:...`) | 是（通知）/ Yes (notifications) |
| `CRON_SECRET` | Secret for cron job auth | 是（通知）/ Yes (notifications) |

完整設定步驟請參閱 [SETUP.md](./SETUP.md)。

For full setup instructions, see [SETUP.md](./SETUP.md).

---

## 部署 / Deploy

```bash
npx vercel          # Preview environment
npx vercel --prod   # Production environment
```

Or connect the GitHub repo to [vercel.com](https://vercel.com) for automatic deployments.

### 推送通知設定 / Notification Setup

Vercel 免費方案不支援高頻 cron job，需設定外部 cron 服務：

Vercel's free plan doesn't support frequent cron jobs. Set up an external cron service:

1. 前往 [cron-job.org](https://cron-job.org)（免費）
2. URL 設為：`https://<your-domain>/api/notify`
3. 排程設定：`*/5 * * * *`（每 5 分鐘）
4. 可選：加入 `Authorization` header：`Bearer <CRON_SECRET>`

---

## 專案結構 / Project Structure

```
sushiro-hk-live/
├── api/                            # Vercel Serverless Functions
│   ├── _lib/
│   │   ├── cache.ts                # 共用快取邏輯 / Shared caching
│   │   ├── kv.ts                   # Upstash Redis client
│   │   ├── push.ts                 # Web Push sender (VAPID)
│   │   ├── notify-logic.ts         # Ticket position + notification tiers
│   │   └── notify-logic.test.ts    # Notification logic tests
│   ├── stores.ts                   # GET /api/stores
│   ├── queue.ts                    # GET /api/queue?storeid=<id>
│   ├── store/[id].ts               # GET /api/store/<id>
│   ├── register.ts                 # POST /api/register
│   ├── notify.ts                   # GET /api/notify (cron-triggered)
│   ├── vapid-public-key.ts         # GET /api/vapid-public-key
│   └── health.ts                   # GET /api/health
├── src/
│   ├── components/                 # 31 React components
│   │   ├── Navbar.tsx              # Tab navigation
│   │   ├── BookmarksSection.tsx    # Bookmark management
│   │   ├── CompactStoreRow.tsx     # Store list row
│   │   ├── CompareView.tsx         # Side-by-side comparison
│   │   ├── StoreDetailModal.tsx    # Store detail + ticket calculator
│   │   ├── StoreMap.tsx            # Leaflet interactive map
│   │   ├── FareCalculator.tsx      # Price calculator
│   │   ├── NotificationBell.tsx    # Push notification subscribe
│   │   └── ...                     # 23 more components
│   ├── hooks/                      # Custom React hooks
│   │   ├── useBookmarks.ts
│   │   ├── useFareCalculator.ts
│   │   ├── useFilters.ts
│   │   └── useIsTouch.ts
│   ├── utils/                      # Utility functions
│   │   ├── geolocation.ts          # GPS + Haversine distance
│   │   ├── push.ts                 # Client-side push logic
│   │   └── status.ts               # Store/ticket status helpers
│   ├── data/
│   │   └── menu.ts                 # Sushiro price tier definitions
│   ├── App.tsx                     # Root component
│   ├── main.tsx                    # Entry point
│   ├── config.ts                   # Centralized config constants
│   └── types.ts                    # TypeScript interfaces
├── public/
│   ├── manifest.json               # PWA Web App Manifest
│   ├── sw.js                       # Service Worker
│   ├── robots.txt
│   ├── sitemap.xml
│   └── icon.svg
├── index.html                      # HTML entry (SEO, PWA, structured data)
├── vercel.json                     # Vercel deployment config
├── vite.config.ts
├── vitest.config.ts
├── SETUP.md                        # Notification system setup guide
└── package.json
```

---

## 免責聲明 / Disclaimer

本網頁與壽司郎（Sushiro）官方無任何關聯。資料來源為 SUSHI-PASS API，資料準確性以官方為準。

This website is not affiliated with or endorsed by Sushiro. Data is sourced from the SUSHI-PASS API; accuracy is subject to the official source.
---

If this saved you time or gave you an idea, a ⭐ on the repo is appreciated — it helps others find it.
