# SEO Optimization Design Spec — Sushiro HK Live

## Problem

This is a client-side rendered React SPA (Vite + React 19) with no routing. Crawlers see an empty `<div id="root"></div>` — no store content, no per-store pages, no indexable content. The sitemap has 1 URL. Structured data is basic (`WebApplication` only).

## Goals

1. Make all content indexable by search engines
2. Create per-store pages with unique meta tags
3. Expand sitemap and structured data
4. Improve performance for Core Web Vitals

## Scope (Quick Wins — 1-2 sessions)

### 1. Add Client-Side Routing (Store Pages Only)

**What:** Install `react-router-dom` with a single route for store pages. Tabs remain state-based.

**Routes:**
- `/` — main app (all tabs, identical to current behavior)
- `/store/:id` — individual store detail page (new, for crawlers + direct URL access)

**What stays the same:**
- Tab navigation remains **state-based** — no URL change when clicking tabs
- Store detail **modal** stays for in-app clicks — zero behavior change for existing users
- Back/forward buttons continue to work as they do now (no change)

**Why:** Crawlers need unique URLs to index each store. Currently store detail is a modal with no URL.

**Implementation:**
- Add `react-router-dom` dependency
- Wrap app in `<BrowserRouter>` in `main.tsx`
- Add a single `<Route path="/store/:id" element={<StorePage />} />` in `App.tsx`
- Create `src/pages/StorePage.tsx` — full-page store detail (same content as modal, but as a standalone page)
- Modal remains the primary way to view stores in-app; `StorePage` is for direct URL access and crawlers
- `StorePage` reads `:id` from URL, fetches store data, renders detail + queue info

**User impact:** None. Existing users click stores → modal opens (unchanged). New: users can also visit `/store/123` directly.

### 2. Pre-render Static HTML at Build Time

**What:** Use `vite-plugin-prerender` to generate static HTML for the main page and all 44 store pages.

**How:**
1. Build script fetches store list from upstream API (`sushipass.sushiro.com.hk`)
2. For each store, generates a prerendered HTML file at `/store/{id}`
3. Each prerendered page includes:
   - Store name, address, area in `<title>`, `<meta description>`, OG tags
   - `LocalBusiness` structured data (JSON-LD)
   - Store content in the HTML (not just a loading skeleton)

**Plugin:** `vite-plugin-prerender`
- Scans rendered HTML for links and prerender those
- Supports custom routes and data injection
- Outputs static `.html` files to `dist/`

**Data injection strategy:**
- Build script fetches store list from upstream API once
- For each store page, embeds store data as `<script>window.__STORE_DATA__ = { store: {...}, stores: [...] }</script>` in the prerendered HTML
- React app's data hook checks `window.__STORE_DATA__` first; if present, uses it immediately (no flash); if absent (dev mode), fetches from API as before
- Queue data is ephemeral — NOT prerendered. Live queue loads via JS after mount.
- This means crawlers see: store name, address, area, status in the HTML. Queue data is dynamic and not critical for indexing.

### 3. Expand Sitemap

**What:** Generate a complete `sitemap.xml` with all 44 store URLs.

**Current:** Only has `/` with `lastmod: 2026-07-28`.

**New sitemap entries:**
```xml
<url>
  <loc>https://sushiro-hk-live.vercel.app/</loc>
  <lastmod>2026-08-01</lastmod>
  <changefreq>always</changefreq>
  <priority>1.0</priority>
</url>
<url>
  <loc>https://sushiro-hk-live.vercel.app/store/1</loc>
  <lastmod>2026-08-01</lastmod>
  <changefreq>always</changefreq>
  <priority>0.8</priority>
</url>
<!-- ... 44 store URLs total -->
```

**Implementation:** Build script generates `sitemap.xml` alongside prerendered pages.

### 4. Enhanced Structured Data

**What:** Add `LocalBusiness` (or `Restaurant`) JSON-LD schema per store page.

**Per-store schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "壽司郎 荃灣廣場",
  "alternateName": "Sushiro Tsuen Wan Plaza",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "...",
    "addressLocality": "Hong Kong",
    "addressRegion": "荃灣",
    "addressCountry": "HK"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 22.3717,
    "longitude": 114.1137
  },
  "url": "https://sushiro-hk-live.vercel.app/store/1",
  "sameAs": "https://www.sushiro.com.hk/",
  "servesCuisine": "Japanese",
  "priceRange": "$$"
}
```

**Main page:** Keep existing `WebApplication` schema, add `WebSite` with `SearchAction` for sitelinks search box.

### 5. Performance Optimizations

**What:** Improve Core Web Vitals scores.

- **Lazy load** `StoreMap` (Leaflet is heavy) — only load when map tab is active
- **Lazy load** `FareCalculator` — only load when fare tab is active
- **Preload** critical CSS (already using Tailwind, so mostly done)
- **Add caching headers** in `vercel.json` for static assets:
  ```json
  { "source": "/assets/(.*)", "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}] }
  ```
- **Image optimization:** Add `loading="lazy"` to images, use `decoding="async"`

### 6. Meta Tag Improvements

**What:** Per-store dynamic meta tags.

**For each store page (`/store/:id`):**
- `<title>` — `壽司郎 {store.name} - 即時等候時間 | 壽司郎 HK Live`
- `<meta name="description">` — `壽司郎 {store.name} ({store.nameEn}) 即時等候時間：{store.wait} 分鐘，{store.waitingGroup} 組輪候中。地址：{store.address}`
- `<meta property="og:title">` — same as title
- `<meta property="og:description">` — same as description
- `<meta property="og:url">` — `https://sushiro-hk-live.vercel.app/store/{id}`
- `<link rel="canonical">` — `https://sushiro-hk-live.vercel.app/store/{id}`

**Main page:** Keep existing tags, they're already good.

## Architecture

```
Build Time:
  1. Fetch store list from upstream API
  2. For each store, prerender /store/{id} HTML with embedded data
  3. Generate sitemap.xml with all 44 store URLs
  4. Output to dist/

Runtime:
  / (SPA)         → prerendered shell, React hydrates, tabs work as before (state-based)
  /store/:id      → prerendered store page, React hydrates with live queue data
  Modal (in-app)  → unchanged, opens on store click within the SPA
  /api/*          → serverless functions (unchanged)
```

**Key principle:** The existing SPA is untouched. Routing adds one new entry point (`/store/:id`) for crawlers and direct access. The modal remains the primary in-app experience.

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modify | Add `react-router-dom`, `vite-plugin-prerender` |
| `vite.config.ts` | Modify | Add prerender plugin config |
| `src/main.tsx` | Modify | Wrap in `BrowserRouter` |
| `src/App.tsx` | Modify | Add `<Route>` for `/store/:id` |
| `src/pages/StorePage.tsx` | **Create** | Individual store detail page (same content as modal, standalone) |
| `src/data/storeData.ts` | **Create** | Build-time store data provider |
| `scripts/prerender.ts` | **Create** | Build script for prerendering + sitemap |
| `public/sitemap.xml` | Modify | Expand with all store URLs |
| `vercel.json` | Modify | Add caching headers |
| `index.html` | Modify | Minor meta tag additions |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Upstream API unreachable at build time | Cache store list in repo as fallback; build script retries |
| Prerender plugin compatibility with React 19 | Test with vite-plugin-prerender latest; fallback to `vite-ssg` |
| Stale prerendered content | Queue data is ephemeral — prerender only static store info; live data loads via JS |
| Increased build time | 44 pages is fast; parallelize with `Promise.all` |

## Out of Scope

- Content pages (blog, store locator landing pages)
- Programmatic SEO (auto-generated articles)
- Full SSR migration (Next.js)
- i18n (English version of pages)
