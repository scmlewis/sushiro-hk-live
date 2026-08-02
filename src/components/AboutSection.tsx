import React from 'react';
import { Store, Heart, Layers, Calculator, WifiOff, Clock, Sparkles, CheckCircle2, ExternalLink, Github, Type, Facebook, Instagram, Map, Locate, Info } from 'lucide-react';

const SUSHIRO_HK_URL = 'https://sushirohk.com.hk/';

interface AboutSectionProps {
  textSize: 'S' | 'M' | 'L';
  onTextSizeChange: (size: 'S' | 'M' | 'L') => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ textSize, onTextSizeChange }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 mb-12 animate-fade-in">
      {/* Intro Banner */}
      <div className="bg-neutral-900 text-white p-6 sm:p-8 rounded-2xl border-l-4 border-[#aa151b] shadow-xl shadow-neutral-900/20 relative overflow-hidden">
        <div className="seigaiha-bg" />
        <div className="relative z-10 flex items-center gap-3 mb-3">
          <span className="px-2.5 py-0.5 bg-[#aa151b] text-white text-[10px] font-black uppercase tracking-widest rounded">
            系統簡介
          </span>
          <span className="text-xs font-bold text-neutral-400">
            香港壽司郎即時籌號追蹤看板
          </span>
        </div>
        <h2 className="relative z-10 text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
          系統簡介與使用說明
        </h2>
        <p className="relative z-10 text-xs sm:text-sm text-neutral-300 leading-relaxed font-medium">
          本系統連結全港壽司郎門市之籌號發放狀態、預估等候時間及現場叫號進度。透過智慧連線機制，助您迅速掌握現場人流，節省現場等候時間。
        </p>
      </div>

      {/* Grid of Key Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Feature 1: Store Directory & Search */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] space-y-2.5">
          <div className="flex items-center gap-2.5 text-[#aa151b]">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-100 dark:border-red-900/40">
              <Store className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-neutral-900 dark:text-white">
              全港門市即時列表
            </h3>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
            收錄全港地區所有營業中門市，支援按港島、九龍、新界地區篩選，或關鍵字搜尋。列表隨時顯示現場是否派籌中、目前叫號進度及預估等候時間。
          </p>
        </div>

        {/* Feature 2: Bookmarking & Auto Poll */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] space-y-2.5">
          <div className="flex items-center gap-2.5 text-[#aa151b]">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-100 dark:border-red-900/40">
              <Heart className="w-5 h-5 fill-[#aa151b]" />
            </div>
            <h3 className="text-base font-black text-neutral-900 dark:text-white">
              我的關注門市
            </h3>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
            點擊門市卡片或列表上的 ♥ 即可加入「我的關注」。關注門市享每 10 秒高頻背景自動同步叫號，讓您在前往餐廳途中即時掌握號碼變化。
          </p>
        </div>

        {/* Feature 3: Store Comparison */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] space-y-2.5">
          <div className="flex items-center gap-2.5 text-[#aa151b]">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-100 dark:border-red-900/40">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-neutral-900 dark:text-white">
              門市比對
            </h3>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
            同時選擇 2 至 4 間相鄰門市（例如：馬鞍山店 vs 沙田店），即時橫向比對預估等候時間與現場輪候組數，幫助您決定前往最快入座的門市。
          </p>
        </div>

        {/* Feature 4: Ticket Calculator */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] space-y-2.5">
          <div className="flex items-center gap-2.5 text-[#aa151b]">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-100 dark:border-red-900/40">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-neutral-900 dark:text-white">
              籌號進度估算
            </h3>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
            在門市詳情視圖中，輸入您手上的籌號（例如 #200），系統會根據現場最新叫號與各類別進度（桌席、吧台、現場籌），自動算出身前剩餘組數與預估等候時間。
          </p>
        </div>

        {/* Feature 5: Map View */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] space-y-2.5">
          <div className="flex items-center gap-2.5 text-[#aa151b]">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-100 dark:border-red-900/40">
              <Map className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-neutral-900 dark:text-white">
              地圖模式
            </h3>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
            切換至地圖分頁，以互動地圖檢視全港門市分佈。各門市以顏色標記顯示等候狀態（綠色即時入座、黃/橙/紅色 longer wait），點擊標記即可預覽詳情或直接開啟 Google 地圖導航。
          </p>
        </div>

        {/* Feature 6: GPS & Distance Sorting */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] space-y-2.5">
          <div className="flex items-center gap-2.5 text-[#aa151b]">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-100 dark:border-red-900/40">
              <Locate className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-neutral-900 dark:text-white">
              GPS 定位與距離排序
            </h3>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
            點擊「以 GPS 測算距離」按鈕取得您的即時位置，門市列表將自動標示與您之間的直線距離，並支援「由近至遠」排序，助您快速找到最近且最快入座的門市。
          </p>
        </div>
      </div>

      {/* Feature 7: Fare Calculator */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] space-y-2.5">
        <div className="flex items-center gap-2.5 text-[#aa151b]">
          <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-100 dark:border-red-900/40">
            <Calculator className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-neutral-900 dark:text-white">
            壽司郎餐費計算器
          </h3>
        </div>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
          輸入預算金額或實際賬單金額，自動計算含服務費的總額。支援多種碟子價格（紅碟$12、銀碟$17、金碟$22、黑碟$27等），可自由新增自訂價格層級（$1–$2500）。逐項點選碟子數量，底部即時顯示項目清單與總額，一目了然。
        </p>
      </div>

      {/* Performance & Offline Guide */}
      <div className="bg-neutral-50 dark:bg-neutral-800/40 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800/60 space-y-3">
        <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>效能與自動更新機制</span>
        </h3>
        <ul className="text-xs text-neutral-600 dark:text-neutral-300 space-y-2 font-medium">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span><strong>頁面閒置或切換分頁時：</strong>自動暫停背景讀取以節省手機電力與流量，回頭檢視時自動更新。</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span><strong>離線快取機制：</strong>系統已配備 Service Worker 快取，在乘搭港鐵或訊號不穩定時，仍可閱讀最新一次載入的門市資料。</span>
          </li>
        </ul>
      </div>

      {/* Text Size Setting */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] space-y-3">
        <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
          <Type className="w-4 h-4 text-[#aa151b]" />
          <span>文字大小</span>
        </h3>
        <div className="flex items-center gap-2">
          {(['S', 'M', 'L'] as const).map((size) => (
            <button
              key={size}
              onClick={() => onTextSizeChange(size)}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all duration-150 cursor-pointer active:scale-95 ${
                textSize === size
                  ? 'bg-[#aa151b] text-white shadow-md'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {size === 'S' ? '細' : size === 'M' ? '中（預設）' : '大'}
            </button>
          ))}
        </div>
      </div>

      {/* PWA Install Guide */}
      <div className="bg-neutral-50 dark:bg-neutral-800/40 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800/60 space-y-3">
        <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>將應用加入主畫面</span>
        </h3>
        <div className="text-xs text-neutral-600 dark:text-neutral-300 space-y-2 font-medium leading-relaxed">
          <p><strong className="text-neutral-900 dark:text-white">Android：</strong>開啟瀏覽器 → 點擊右上角選單（三點）→ 選擇「加入主畫面」→ 確認「設定」→ 點擊「加入」。</p>
          <p><strong className="text-neutral-900 dark:text-white">iOS：</strong>開啟 Safari → 點擊底部分享按鈕 → 向下滑動 → 點擊「加入主畫面」。</p>
          <p className="text-neutral-400 dark:text-neutral-500">加入主畫面後即可如原生 App 使用，支援離線快取與背景自動更新叫號資料。</p>
        </div>
      </div>

      {/* Project Links */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/60 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] space-y-3">
        <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-[#aa151b]" />
          <span>相關資源</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          <a
            href={SUSHIRO_HK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#aa151b] hover:bg-[#8e171d] active:scale-95 text-white text-xs font-bold rounded-xl transition-all duration-150"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>壽司郎官方網站</span>
          </a>
          <a
            href="https://www.facebook.com/SUSHIROHONGKONG"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1877F2] hover:bg-[#166FE5] active:scale-95 text-white text-xs font-bold rounded-xl transition-all duration-150"
          >
            <Facebook className="w-3.5 h-3.5" />
            <span>Facebook</span>
          </a>
          <a
            href="https://www.instagram.com/sushiro.hk/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#F58529] via-[#DD2A7B] via-[#8134AF] to-[#515BD4] hover:opacity-80 active:scale-95 text-white text-xs font-bold rounded-xl transition-all duration-150"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>Instagram</span>
          </a>
          <a
            href="https://github.com/scmlewis"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-95 text-xs font-bold text-neutral-700 dark:text-neutral-300 rounded-xl transition-all duration-150"
          >
            <span>@scmlewis</span>
          </a>
          <a
            href="https://github.com/scmlewis/sushiro-hk-live"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-95 text-xs font-bold text-neutral-700 dark:text-neutral-300 rounded-xl transition-all duration-150"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Repo</span>
          </a>
        </div>
      </div>

      {/* Data Source & Disclaimer */}
      <div className="bg-neutral-50 dark:bg-neutral-800/40 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800/60 space-y-2">
        <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-500" />
          <span>資料來源與免責聲明</span>
        </h3>
        <div className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5 font-medium">
          <p><strong className="text-neutral-900 dark:text-white">資料來源：</strong>SUSHI-PASS API (HK)</p>
          <p><strong className="text-neutral-900 dark:text-white">更新頻率：</strong>每 10 秒自動刷新</p>
          <p><strong className="text-neutral-900 dark:text-white">免責聲明：</strong>本網站與壽司郎官方無關，資料僅供參考。</p>
        </div>
      </div>
    </div>
  );
};
