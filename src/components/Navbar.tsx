import React from 'react';
import { RefreshCw, Heart, Layers, Clock, Store, HelpCircle } from 'lucide-react';

interface NavbarProps {
  lastUpdated: number | null;
  loading: boolean;
  bookmarkCount: number;
  compareCount: number;
  storeCount: number;
  activeMainTab: 'all' | 'bookmarks' | 'compare' | 'about';
  onSelectTab: (tab: 'all' | 'bookmarks' | 'compare' | 'about') => void;
  onGlobalRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lastUpdated,
  loading,
  bookmarkCount,
  compareCount,
  storeCount,
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
    <header className="sticky top-0 z-40 bg-[#E21F26] text-white shadow-lg backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Brand & Clock */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-white">
              壽司郎 HK
            </h1>
            <span className="bg-white text-[#E21F26] text-[10px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase">
              LIVE
            </span>
          </div>

          <div className="flex sm:hidden items-center gap-2">
            <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full text-[11px] font-bold font-mono">
              <Clock className="w-3 h-3 text-red-200" />
              <span>{formattedTime}</span>
            </div>
            <button
              onClick={onGlobalRefresh}
              disabled={loading}
              className="p-1.5 rounded-full bg-white text-[#E21F26] transition-all cursor-pointer disabled:opacity-60"
              title="更新數據"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Center Main Tab Navigation (Single Source of Truth) */}
        <nav className="flex items-center gap-1 bg-black/20 p-1 rounded-full border border-white/20 w-full sm:w-auto overflow-x-auto no-scrollbar justify-between sm:justify-center">
          <button
            onClick={() => onSelectTab('all')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-full font-black text-xs transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
              activeMainTab === 'all'
                ? 'bg-white text-[#E21F26] shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">全港門市</span>
            <span className="sm:hidden">門市</span>
            <span>({storeCount})</span>
          </button>

          <button
            onClick={() => onSelectTab('bookmarks')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-full font-black text-xs transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
              activeMainTab === 'bookmarks'
                ? 'bg-white text-[#E21F26] shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${activeMainTab === 'bookmarks' ? 'fill-[#E21F26]' : ''}`} />
            <span className="hidden sm:inline">我的關注</span>
            <span className="sm:hidden">關注</span>
            <span>({bookmarkCount})</span>
          </button>

          <button
            onClick={() => onSelectTab('compare')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-full font-black text-xs transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
              activeMainTab === 'compare'
                ? 'bg-white text-[#E21F26] shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">門市比對</span>
            <span className="sm:hidden">比對</span>
            <span>({compareCount})</span>
          </button>

          <button
            onClick={() => onSelectTab('about')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-full font-black text-xs transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
              activeMainTab === 'about'
                ? 'bg-white text-[#E21F26] shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>關於</span>
          </button>
        </nav>

        {/* Right Status & Refresh Button */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-full text-xs font-bold font-mono">
            <Clock className="w-3.5 h-3.5 text-red-200" />
            <span>{formattedTime}</span>
          </div>

          <button
            onClick={onGlobalRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#E21F26] font-black text-xs transition-all cursor-pointer disabled:opacity-60 hover:bg-red-50 shadow-sm"
            title="重新讀取全港門市叫號數據"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? '更新中' : '更新數據'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};



