import type { BusynessData, PopularTimesHour } from '../../src/types.js';

interface BusynessCacheEntry {
  data: BusynessData | null;
  timestamp: number;
  placeId?: string;
}

const BUSYNESS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const busynessCache = new Map<string, BusynessCacheEntry>();

function getApiKey(): string | undefined {
  return process.env.GOOGLE_MAPS_API_KEY;
}

function getHkHour(): number {
  const now = new Date();
  const hkTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }));
  return hkTime.getHours();
}

async function findPlaceId(
  storeName: string,
  lat: number,
  lng: number,
  apiKey: string
): Promise<string | null> {
  const url = `https://places.googleapis.com/v1/places:searchText?fields=id&key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      textQuery: `壽司郎 ${storeName}`,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 5000.0,
        },
      },
      maxResultCount: 1,
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.places?.[0]?.id ?? null;
}

async function getPlaceBusyness(
  placeId: string,
  apiKey: string
): Promise<{ live: number | null; popularTimes: PopularTimesHour[] | null }> {
  const fields = 'currentOpeningHours,popularTimes';
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?fields=${fields}&key=${apiKey}`;

  const res = await fetch(url);

  if (!res.ok) return { live: null, popularTimes: null };

  const data = await res.json();

  let live: number | null = null;
  if (data.currentOpeningHours?.busyNow !== undefined) {
    live = data.currentOpeningHours.busyNow;
  }

  let popularTimes: PopularTimesHour[] | null = null;
  if (data.popularTimes && Array.isArray(data.popularTimes)) {
    const today = new Date().getDay(); // 0=Sunday
    const todayData = data.popularTimes[today];
    if (todayData?.hours && Array.isArray(todayData.hours)) {
      popularTimes = todayData.hours.map((h: any) => ({
        hour: h.hour ?? 0,
        busy: h.busy ?? 0,
      }));
    }
  }

  return { live, popularTimes };
}

export async function getBusynessData(
  storeId: number,
  storeName: string,
  lat: number,
  lng: number,
  forceFresh = false
): Promise<{ data: BusynessData | null; cached: boolean; timestamp: number }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { data: null, cached: false, timestamp: Date.now() };
  }

  const cacheKey = `busyness_${storeId}`;
  const cached = busynessCache.get(cacheKey);

  if (!forceFresh && cached && Date.now() - cached.timestamp < BUSYNESS_CACHE_TTL) {
    return { data: cached.data, cached: true, timestamp: cached.timestamp };
  }

  try {
    let placeId = cached?.placeId;
    if (!placeId) {
      placeId = await findPlaceId(storeName, lat, lng, apiKey) ?? undefined;
      if (!placeId) {
        const entry: BusynessCacheEntry = { data: null, timestamp: Date.now() };
        busynessCache.set(cacheKey, entry);
        return { data: null, cached: false, timestamp: entry.timestamp };
      }
    }

    const { live, popularTimes } = await getPlaceBusyness(placeId, apiKey);

    const busynessData: BusynessData = {
      live,
      popularTimes,
      currentHour: getHkHour(),
    };

    const entry: BusynessCacheEntry = {
      data: busynessData,
      timestamp: Date.now(),
      placeId,
    };
    busynessCache.set(cacheKey, entry);

    return { data: busynessData, cached: false, timestamp: entry.timestamp };
  } catch {
    if (cached) {
      return { data: cached.data, cached: true, timestamp: cached.timestamp };
    }
    return { data: null, cached: false, timestamp: Date.now() };
  }
}
