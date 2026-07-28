import React, { useState } from 'react';
import { SortOption } from '../types';
import { Search, ArrowUpDown, Filter, Navigation, ChevronDown, Check } from 'lucide-react';

interface DistrictFilterBarProps {
  selectedArea: string;
  regionCounts?: { all: number; hkIsland: number; kowloon: number; nt: number };
  searchQuery: string;
  sortBy: SortOption;
  onlyIssuingTickets: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  locationLoading: boolean;
  onSelectArea: (area: string) => void;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: SortOption) => void;
  onToggleOnlyIssuing: () => void;
  onRequestLocation: () => void;
}

const FILTER_EXPANDED_KEY = 'sushiro_filter_bar_expanded';

export const DistrictFilterBar: React.FC<DistrictFilterBarProps> = ({
  selectedArea,
  regionCounts = { all: 0, hkIsland: 0, kowloon: 0, nt: 0 },
  searchQuery,
  sortBy,
  onlyIssuingTickets,
  userLocation,
  locationLoading,
  onSelectArea,
  onSearchChange,
  onSortChange,
  onToggleOnlyIssuing,
  onRequestLocation,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(FILTER_EXPANDED_KEY);
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const toggleExpand = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(FILTER_EXPANDED_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save filter expanded preference', e);
      }
      return next;
    });
  };

  // Count active non-default filters for mobile badge
  const activeFiltersCount =
    (selectedArea !== '' ? 1 : 0) +
    (onlyIssuingTickets ? 1 : 0) +
    (sortBy !== 'wait-asc' ? 1 : 0);

  return (
    <div className="sticky top-14 z-30 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 sm:p-4 mb-4 space-y-3 shadow-sm transition-all rounded-xl">
      {/* Top Main Row: Search Input + Mobile Filter Toggle Button */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜尋門市（如：旺角、葵芳、銅鑼灣）..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-[#E21F26] text-xs sm:text-sm font-bold text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none transition-all"
          />
        </div>

        {/* Mobile Filter Options Expand Toggle Button (Visible on mobile, hidden on desktop md:hidden) */}
        <button
          onClick={toggleExpand}
          className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer border ${
            isExpanded || activeFiltersCount > 0
              ? 'bg-[#141414] text-white dark:bg-white dark:text-[#141414] border-transparent shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
          }`}
          title="切換篩選選項"
        >
          <Filter className="w-3.5 h-3.5 text-[#E21F26]" />
          <span>篩選選項</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#E21F26] text-white text-[10px] font-black flex items-center justify-center shrink-0">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Collapsible Filter Options Panel (Collapsed by default on mobile, always visible on md+) */}
      <div
        className={`${
          isExpanded ? 'block' : 'hidden md:block'
        } space-y-3 pt-2 md:pt-0 border-t md:border-none border-neutral-100 dark:border-neutral-800 transition-all`}
      >
        {/* Row 1: Sort Selector & Location Button */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative w-full sm:w-60">
            <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="w-full pl-10 pr-8 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-[#E21F26] text-xs font-extrabold text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer appearance-none uppercase"
            >
              <option value="wait-asc">⏱️ 等候時間最短</option>
              <option value="wait-desc">⏳ 等候時間最長</option>
              <option value="groups-desc">👥 輪候組數最多</option>
              {userLocation && <option value="distance-asc">📍 距離最近（GPS）</option>}
              <option value="area-asc">🗺️ 地區名稱排序</option>
              <option value="name-asc">🔤 門市名稱排序</option>
            </select>
          </div>

          {/* Location Request Button */}
          <button
            onClick={onRequestLocation}
            disabled={locationLoading}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-black transition-all w-full sm:w-auto justify-center cursor-pointer ${
              userLocation
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200'
            }`}
            title="開啟 GPS 尋找附近門市"
          >
            <Navigation className={`w-3.5 h-3.5 ${locationLoading ? 'animate-spin' : ''}`} />
            <span>
              {locationLoading ? 'GPS 定位中...' : userLocation ? 'GPS 已定位' : '以 GPS 測算距離'}
            </span>
          </button>
        </div>

        {/* Row 2: Region Pills (All / HK Island / Kowloon / NT) + Filter Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar pt-1">
          <span className="text-neutral-400 font-extrabold uppercase tracking-widest text-[10px] flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>分區:</span>
          </span>

          <button
            onClick={() => onSelectArea('')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              selectedArea === ''
                ? 'bg-[#141414] text-white shadow-md dark:bg-white dark:text-[#141414]'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
            }`}
          >
            全港 ({regionCounts.all})
          </button>

          <button
            onClick={() => onSelectArea('港島')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              selectedArea === '港島'
                ? 'bg-[#141414] text-white shadow-md dark:bg-white dark:text-[#141414]'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
            }`}
          >
            港島 ({regionCounts.hkIsland})
          </button>

          <button
            onClick={() => onSelectArea('九龍')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              selectedArea === '九龍'
                ? 'bg-[#141414] text-white shadow-md dark:bg-white dark:text-[#141414]'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
            }`}
          >
            九龍 ({regionCounts.kowloon})
          </button>

          <button
            onClick={() => onSelectArea('新界')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              selectedArea === '新界'
                ? 'bg-[#141414] text-white shadow-md dark:bg-white dark:text-[#141414]'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
            }`}
          >
            新界 ({regionCounts.nt})
          </button>

          {/* Filter Toggle: Only issuing tickets */}
          <button
            onClick={onToggleOnlyIssuing}
            className={`ml-auto px-3.5 py-1.5 rounded-full font-extrabold text-xs transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              onlyIssuingTickets
                ? 'bg-[#E21F26] text-white shadow-md'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
            }`}
          >
            {onlyIssuingTickets && <Check className="w-3 h-3" />}
            <span>只看派籌中</span>
          </button>
        </div>
      </div>
    </div>
  );
};



