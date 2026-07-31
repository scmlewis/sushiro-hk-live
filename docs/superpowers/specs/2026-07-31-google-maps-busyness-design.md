# Google Maps Busyness Data — Design Spec

## Overview

Add store busyness data from Google Maps to the store detail modal. Shows both real-time "Live Busyness" (current occupancy relative to typical) and "Popular Times" (historical hourly patterns). Uses a server-side Vercel function with caching to keep the Google Maps API key secure and minimize costs.

## Goals

- Show how busy each Sushiro store currently is relative to typical levels
- Show historical busyness patterns to help users plan visits
- Keep costs within Google's $200/month free tier
- Gracefully degrade when data unavailable

## Architecture

```
Client (StoreDetailModal)
  → GET /api/busyness?storeid=<id>
    → Vercel Serverless Function
      → findPlaceFromQuery (first request per store)
      → getDetails (popularTimes, currentOpeningHours)
      → 30-min cache in server memory
    ← { busyness: { live: number, popularTimes: [...] } }
  ← Display in modal
```

## Server-side: `/api/busyness` Endpoint

**File:** `api/busyness.ts`

### Request

```
GET /api/busyness?storeid=<id>
```

- `storeid` (required): The Sushiro store ID (number)

### Response

```typescript
{
  busyness: {
    live: number | null;        // 0-100, current occupancy % vs typical
    popularTimes: Array<{       // 24 entries, one per hour
      hour: number;             // 0-23
      busy: number;             // 0-100, relative busyness
    }> | null;
    currentHour: number;        // 0-23, server's current hour in HK timezone
  } | null;
}
```

Returns `{ busyness: null }` if:
- `GOOGLE_MAPS_API_KEY` env var is not set
- Store not found on Google Maps
- Google API error

### Google Places API Usage

Uses the **Places API (New)** with two calls per store on first request:

1. **findPlaceFromQuery** — Resolve store name to Google Place ID
   - Query: `"壽司郎 {store.name}"` (e.g., `"壽司郎 荃灣廣場"`)
   - Location bias: store's lat/lng
   - Field mask: `id,name,location`

2. **getDetails** — Fetch busyness data
   - Place ID from step 1
   - Field mask: `currentOpeningHours,popularTimes`

### Caching

- In-memory cache (Map), keyed by store ID
- TTL: 30 minutes
- Cached data includes: Place ID, live busyness, popular times, resolved timestamp
- Same pattern as existing `storesCache` / `queuesCache` in `api/_lib/cache.ts`

### Error Handling

- Google API failure → return `{ busyness: null }` (200 status, graceful degradation)
- Missing API key → return `{ busyness: null }` immediately
- Store not found on Google → return `{ busyness: null }`

## Client-side: Store Detail Modal

**File:** `src/components/StoreDetailModal.tsx`

### Behavior

1. When modal opens, call `GET /api/busyness?storeid=<id>`
2. Show loading skeleton while fetching
3. Display two sections (or hide if data unavailable):

### A. Live Busyness Indicator

- Horizontal bar or badge showing current busyness level
- Color coding:
  - Green (0-25%): Quiet
  - Yellow (25-50%): Moderate
  - Orange (50-75%): Busy
  - Red (75-100%): Very busy
- Label: "目前人流" with percentage
- Hidden if `live` is null

### B. Popular Times Chart

- Bar chart using Recharts (already in project)
- X-axis: operating hours (10:00–22:00 for Sushiro)
- Y-axis: busyness level (0-100%)
- Current hour highlighted with a different shade/bar color
- Bar colors: muted gray for past hours, accent color for current/future
- Hidden if `popularTimes` is null

### State Management

- `useState` + `useEffect` in modal component
- No client-side caching (fresh data each modal open)
- Loading state: skeleton placeholder matching chart dimensions
- Error state: silently hide busyness section

## Environment

### New Env Var

```
GOOGLE_MAPS_API_KEY=your_key_here
```

Add to `.env.example` with comment:
```
# Google Maps API key for busyness data (Places API (New) must be enabled)
# If not set, busyness feature is disabled
GOOGLE_MAPS_API_KEY=
```

### Google Cloud Console Setup

1. Create or select a Google Cloud project
2. Enable "Maps JavaScript API" and "Places API (New)"
3. Create an API key
4. Restrict key to HTTP referrer (Vercel deployment URL)

### Graceful Degradation

- If `GOOGLE_MAPS_API_KEY` is not set, the feature is completely hidden
- No errors shown to user
- No broken UI

## Cost Analysis

- **Google Places API (New):** $17 per 1,000 requests
- **Free tier:** $200/month credit = ~11,700 free requests
- **Typical usage:** 44 stores × (1 findPlace + 1 getDetails) = 88 calls per 30-min cache cycle
- **Daily cost:** ~4,224 calls/day max = ~$71.81/month (but cached, actual is much lower)
- **With caching:** Only 1 set of calls per store per 30 min, regardless of user count
- **Realistic:** ~2,000-3,000 calls/day = well within free tier

## Files to Create/Modify

### New Files
- `api/busyness.ts` — Serverless function
- `api/_lib/busyness-cache.ts` — Cache logic (or extend `api/_lib/cache.ts`)

### Modified Files
- `src/components/StoreDetailModal.tsx` — Add busyness display
- `.env.example` — Add `GOOGLE_MAPS_API_KEY`

### Optional New Files
- `src/components/BusynessChart.tsx` — Popular Times bar chart component
- `src/components/LiveBusynessBadge.tsx` — Live busyness indicator component

## Testing Considerations

- Mock Google Places API responses for unit tests
- Test graceful degradation when API key missing
- Test cache behavior (TTL, hit/miss)
- Test modal rendering with various busyness data states (loading, available, unavailable)
