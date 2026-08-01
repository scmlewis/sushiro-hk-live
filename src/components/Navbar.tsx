import React from 'react';
import { RefreshCw, Heart, Layers, Calculator, Store, HelpCircle, Wallet, Clock } from 'lucide-react';

interface NavbarProps {
  lastUpdated: number | null;
  loading: boolean;
  bookmarkCount: number;
  compareCount: number;
  activeMainTab: 'all' | 'bookmarks' | 'compare' | 'fare' | 'about';
  onSelectTab: (tab: 'all' | 'bookmarks' | 'compare' | 'fare' | 'about') => void;
  onGlobalRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lastUpdated,
  loading,
  bookmarkCount,
  compareCount,
  activeMainTab,
  onSelectTab,
  onGlobalRefresh,
}) => {
  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('zh-HK', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--:--';

  return (
    <header className="sticky top-0 z-40 bg-[#aa151b] text-white shadow-lg backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Brand & Clock */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="壽司郎 HK Live" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-white">
              壽司郎 HK
            </h1>
            <span className="bg-white text-[#aa151b] text-[10px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase">
              LIVE
            </span>
          </div>

          <div className="flex sm:hidden items-center gap-2">
            <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full text-[11px] font-bold font-mono">
              <span className="text-red-200">最後更新</span>
              <Clock className="w-3 h-3 text-red-200" />
              <span>{formattedTime}</span>
            </div>
            <button
              onClick={onGlobalRefresh}
              disabled={loading}
              className="p-2 rounded-full bg-white text-[#aa151b] transition-all duration-150 cursor-pointer disabled:opacity-60 active:scale-95"
              title="更新資料"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Center Main Tab Navigation (Single Source of Truth) */}
        <nav className="flex items-center gap-0.5 bg-black/20 p-1 rounded-full border border-white/10 w-full sm:w-auto overflow-x-auto no-scrollbar justify-between sm:justify-center">
          {([
            { id: 'all' as const, icon: Store, labelFull: '全港門市', labelShort: '門市' },
            { id: 'bookmarks' as const, icon: Heart, labelFull: '我的關注', labelShort: '關注', count: bookmarkCount, fill: activeMainTab === 'bookmarks' },
            { id: 'compare' as const, icon: Layers, labelFull: '門市比較', labelShort: '比較', count: compareCount },
            { id: 'fare' as const, icon: Wallet, labelFull: '價格計算器', labelShort: '價格' },
            { id: 'about' as const, icon: HelpCircle, labelFull: '關於', labelShort: '關於' },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-full font-black text-xs transition-all duration-150 cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 active:scale-95 ${
                activeMainTab === tab.id
                  ? 'bg-white text-[#aa151b] shadow-sm'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon className={`w-3.5 h-3.5 ${tab.fill ? 'fill-[#aa151b]' : ''}`} />
              <span className="hidden sm:inline">{tab.labelFull}</span>
              <span className="sm:hidden">{tab.labelShort}</span>
              {tab.count !== undefined && <span>({tab.count})</span>}
            </button>
          ))}
        </nav>

        {/* Right Status & Refresh Button */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-full text-xs font-bold font-mono">
            <span className="text-red-200">最後更新</span>
            <Clock className="w-3.5 h-3.5 text-red-200" />
            <span>{formattedTime}</span>
          </div>

          <button
            onClick={onGlobalRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white text-[#aa151b] font-black text-xs transition-all duration-150 cursor-pointer disabled:opacity-60 hover:bg-red-50 active:scale-95 shadow-sm"
            title="重新載入全港門市即時資料"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? '更新中…' : '更新資料'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};



