<div align="center">

# 壽司郎 HK Live Queue

**即時追蹤香港全港 44 間壽司郎門市之籌號發放、輪候組數與預估等候時間**

Real-time queue tracking for all 44 Sushiro locations across Hong Kong.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/scmlewis/sushiro-hk-live)

</div>

---

## 功能一覽 / Features

### 全港門市即時列表 / Live Store Directory
收錄全港 44 間壽司郎門市，每間顯示營業狀態、籌號派發狀態、預估等候時間與輪候組數。支援按地區篩選（港島 / 九龍 / 新界）及關鍵字搜尋。

All 44 Sushiro HK stores with live status, ticket issuance, estimated wait time, and queue count. Filter by region (HK Island / Kowloon / NT) or search by name/address.

### 我的關注門市 / Bookmarked Stores
點擊 ♥ 加入關注後，系統每 10 秒自動刷新該門市之即時叫號進度。

Bookmark stores for automatic 10-second polling of live queue data.

### 門市比對 / Store Comparison
同時選擇 2 至 4 間門市進行即時橫向比對，系統自動標示「最快開枱」與「最少組數」之分店。

Compare 2–4 stores side-by-side with automatic fastest/least-crowded badges.

### 籌號計算器 / Ticket Calculator
輸入您手上之籌號，系統根據現場最新叫號自動計算身前剩餘組數與預估等候時間。

Enter your ticket number to calculate groups ahead and estimated wait based on live calling progress.

### GPS 定位排序 / GPS Distance Sorting
授權地理位置後，自動計算各門市與您之直線距離，支援「距離最近」排序。

Enable GPS to sort stores by distance from your current location.

### PWA 離線支援 / Offline PWA
安裝為 Progressive Web App 後，透過 Service Worker 實現離線快取。

Install as a PWA for offline caching via Service Worker.

---

## 技術架構 / Tech Stack

| 層級 | 技術 |
|------|------|
| 前端 / Frontend | React 19 + TypeScript + Tailwind CSS 4 |
| 建構 / Build | Vite 6 |
| 圖表 / Charts | Recharts |
| 部署 / Deploy | Vercel Serverless Functions |
| 資料來源 / Data Source | Sushiro SUSHI-PASS API (HK) |

---

## 本機開發 / Local Development

```bash
npm install
npm run dev
```

## 部署 / Deploy

```bash
npx vercel          # 預覽環境 / Preview
npx vercel --prod   # 正式環境 / Production
```

或將 GitHub Repo 連接至 [vercel.com](https://vercel.com) 自動部署。

Or connect the GitHub repo to [vercel.com](https://vercel.com) for automatic deployments.

---

## 專案結構 / Project Structure

```
sushiro-hk-live/
├── api/                    # Vercel Serverless Functions
│   ├── _lib/cache.ts       # 共用快取邏輯 / Shared caching logic
│   ├── stores.ts           # GET /api/stores
│   ├── queue.ts            # GET /api/queue?storeid=<id>
│   ├── store/[id].ts       # GET /api/store/<id>
│   └── health.ts           # GET /api/health
├── public/
│   ├── manifest.json       # Web App Manifest
│   ├── sw.js               # Service Worker
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── components/         # React components
│   ├── utils/              # Utility functions
│   ├── App.tsx
│   ├── main.tsx
│   └── types.ts
├── vercel.json
└── vite.config.ts
```

---

## 免責聲明 / Disclaimer

本網頁與壽司郎（Sushiro）官方無任何關聯。資料來源為 SUSHI-PASS API，資料準確性以官方為準。

This website is not affiliated with or endorsed by Sushiro. Data is sourced from the SUSHI-PASS API; accuracy is subject to the official source.
