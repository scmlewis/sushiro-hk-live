<div align="center">

# 壽司郎 HK Live Queue

**即時追蹤香港全港 44 間壽司郎門市之籌號發放、輪候組數與預估等候時間**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/sushiro-hk-live)

</div>

---

## 功能一覽

### 全港門市即時列表
收錄全港 44 間壽司郎門市，每間顯示營業狀態、籌號派發狀態（派籌中 / 已停止）、預估等候時間與輪候組數。支援按地區篩選（港島 / 九龍 / 新界）及關鍵字搜尋（門市名稱、地址）。

### 我的關注門市
點擊 ♥ 加入關注後，系統每 **10 秒**自動刷新該門市之即時叫號進度，適合正在前往餐廳途中之食客即時追蹤。關注列表置於獨立分頁，一目了然。

### 門市比對
同時選擇 2 至 4 間門市進行即時橫向比對，系統自動標示「最快開枱」與「最少組數」之分店，助您即時決定前往哪間分店。

### 籌號計算器
在門市詳情視圖中，輸入您手上之籌號（例如 #200），系統根據現場最新叫號進度，自動計算：
- 身前尚有多少組
- 預估等候分鐘數
- 是否已過號（需即刻返回門市）

### 歷史紀錄與人流趨勢
- **歷史紀錄表**：按日期及時段（每 20 分鐘一格）顯示各門市之等候組數、等候時間與人流密度（繁忙 / 中等 / 順暢）
- **1 小時人流趨勢圖**：Area Chart 顯示過去 60 分鐘之等候時間變化，附人流上升 / 舒緩趨勢標示

### 即時叫號明細
點入門市詳情後可查看四類叫號進度：桌席 (Booth)、吧台 (Counter)、現場/混合 (Store/Mixed)、預約 (Reservation)，每類列出當前正在叫號之籌號。

### GPS 定位排序
授權地理位置後，自動計算各門市與您之直線距離，支援「距離最近」排序。若 GPS 不可用，系統以旺角作為預設參考位置。

### PWA 離線支援
安裝為 Progressive Web App 後，透過 Service Worker 實現：
- API 請求：Network First，離線時回退至快取資料
- 靜態資源：Stale-While-Revalidate 策略
- 離線模式橫幅提示

---

## 技術架構

| 層級 | 技術 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 樣式 | Tailwind CSS 4 |
| 建構工具 | Vite 6 |
| 圖表 | Recharts |
| 動畫 | Motion (Framer Motion) |
| 圖示 | Lucide React |
| API 部署 | Vercel Serverless Functions |
| 資料來源 | Sushiro SUSHI-PASS Internal API (HK) |

---

## 專案結構

```
sushiro-hk-live/
├── api/                          # Vercel Serverless Functions
│   ├── _lib/cache.ts             # 共用快取邏輯（30s 門市 / 15s 籌號）
│   ├── stores.ts                 # GET /api/stores
│   ├── queue.ts                  # GET /api/queue?storeid=<id>
│   ├── store/[id].ts             # GET /api/store/<id>
│   └── health.ts                 # GET /api/health
├── public/
│   ├── icon.svg                  # PWA 圖示
│   ├── manifest.json             # Web App Manifest
│   └── sw.js                     # Service Worker
├── src/
│   ├── components/
│   │   ├── Navbar.tsx            # 頂部導航列（分頁切換、更新按鈕）
│   │   ├── DistrictFilterBar.tsx # 地區篩選、搜尋、排序、GPS
│   │   ├── CompactStoreRow.tsx   # 緊湊列表行（主要列表元件）
│   │   ├── StoreCard.tsx         # 完整門市卡片（备用）
│   │   ├── BookmarksSection.tsx  # 我的關注分頁
│   │   ├── CompareDrawer.tsx     # 門市比對側邊欄
│   │   ├── StoreDetailModal.tsx  # 門市詳情彈窗（叫號 + 籌號計算器 + 歷史）
│   │   ├── AboutSection.tsx      # 關於頁面
│   │   └── Toast.tsx             # 提示通知
│   ├── utils/
│   │   ├── status.ts             # 狀態文字與地區判斷
│   │   └── geolocation.ts        # GPS 距離計算
│   ├── types.ts                  # TypeScript 型別定義
│   ├── App.tsx                   # 主應用元件
│   ├── main.tsx                  # 入口檔案（含 Service Worker 註冊）
│   └── index.css                 # Tailwind 入口
├── vercel.json                   # Vercel 部署設定
├── vite.config.ts                # Vite 設定
├── tsconfig.json                 # TypeScript 設定
└── package.json
```

---

## 本機開發

```bash
# 安裝相依套件
npm install

# 啟動開發伺服器
npm run dev
```

開發伺服器預設運行於 `http://localhost:5173`。API 請求會由 Vercel Serverless Functions 處理（需部署至 Vercel 後才能存取 `/api/*` 端點）。

---

## 部署

### Vercel（建議）

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署至預覽環境
vercel

# 部署至正式環境
vercel --prod
```

或將 GitHub Repo 連接至 [vercel.com](https://vercel.com)，每次 push 自動觸發部署。

### API 端點

部署後，以下端點可供使用：

| 端點 | 說明 |
|------|------|
| `GET /api/stores` | 全港門市列表 |
| `GET /api/stores?force=true` | 強制重新從上游取得門市資料 |
| `GET /api/queue?storeid=<id>` | 指定門市即時籌號 |
| `GET /api/store/<id>` | 門市詳情 + 籌號 |
| `GET /api/health` | 健康檢查 |

所有 API 回應格式：

```json
{
  "success": true,
  "cached": false,
  "timestamp": 1700000000000,
  "stores": [...]
}
```

---

## 快取策略

| 資料類型 | TTL | 說明 |
|---------|-----|------|
| 門市列表 | 30 秒 | 避免過度打擊上游 API |
| 籌號資料 | 15 秒 | 保持即時性同時控制請求量 |

離線時，Service Worker 會回退至最近一次成功之 API 快取。

---

## 免責聲明

本專案為個人開發學習用途，與壽司郎（Sushiro）官方無任何關聯。資料來源為 SUSHI-PASS Internal API，資料準確性以官方為準。
