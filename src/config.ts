// ── Application Configuration ──
// All magic numbers and hardcoded values in one place.

/** Fallback location when GPS is unavailable (Mong Kok / Central HK) */
export const FALLBACK_LOCATION = { latitude: 22.3193, longitude: 114.1694 };

/** Default map center when no user location */
export const MAP_CENTER: [number, number] = [22.32, 114.17];

/** Auto-refresh interval for bookmarked stores (ms) */
export const POLL_INTERVAL_MS = 10_000;

/** Toast auto-dismiss duration (ms) */
export const TOAST_DURATION_MS = 3200;

/** Maximum number of stores that can be compared simultaneously */
export const MAX_COMPARE_STORES = 4;

/** Total number of Sushiro stores in HK (display-only, not enforced) */
export const TOTAL_STORE_COUNT = 44;

// ── Cache TTLs (api/_lib/cache.ts) ──

/** Stores list cache TTL (ms) */
export const STORES_CACHE_TTL = 30_000;

/** Queue data cache TTL (ms) */
export const QUEUE_CACHE_TTL = 15_000;

/** Upstream fetch timeout (ms) */
export const FETCH_TIMEOUT_MS = 8000;

// ── localStorage Keys ──

export const STORAGE_KEYS = {
  bookmarks: 'sushiro_hk_bookmarks_v1',
  textSize: 'sushiro_hk_text_size',
  viewMode: 'sushiro_view_mode',
  filterBarExpanded: 'sushiro_filter_bar_expanded',
} as const;

// ── Text Size ──

export type TextSize = 'S' | 'M' | 'L' | 'XL';
export const TEXT_SIZE_MAP: Record<TextSize, string> = {
  S: '12px',
  M: '15px',
  L: '19px',
  XL: '22px',
};

// ── Brand Color ──

export const BRAND_COLOR = '#aa151b';
