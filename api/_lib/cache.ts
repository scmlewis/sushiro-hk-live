export async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-HK,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        ...options.headers,
        'Cache-Control': 's-maxage=15, stale-while-revalidate=60',
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getStoresData(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && storesCache.current && now - storesCache.current.timestamp < STORES_CACHE_TTL) {
    return { data: storesCache.current.data, cached: true, timestamp: storesCache.current.timestamp };
  }

  const upstreamUrl = 'https://sushipass.sushiro.com.hk/api/2.0/info/storelist?latitude=22&longitude=114&numresults=100&region=HK';
  try {
    const res = await fetchWithTimeout(upstreamUrl);
    if (!res.ok) throw new Error(`Upstream HTTP ${res.status}`);
    const rawData = await res.json();
    const list = Array.isArray(rawData) ? rawData : (rawData.stores || rawData.data || []);
    storesCache.current = { data: list, timestamp: now };
    return { data: list, cached: false, timestamp: now };
  } catch (err: any) {
    console.error('[Stores Fetch Error]', err.message || err);
    if (storesCache.current) {
      return {
        data: storesCache.current.data,
        cached: true,
        stale: true,
        timestamp: storesCache.current.timestamp,
        error: 'Upstream connection failed, returning cached data',
      };
    }
    throw err;
  }
}

export async function getQueueData(storeId: string, forceFresh = false) {
  const now = Date.now();
  const cached = queuesCache.get(storeId);
  if (!forceFresh && cached && now - cached.timestamp < QUEUE_CACHE_TTL) {
    return { data: cached.data, cached: true, timestamp: cached.timestamp };
  }

  const upstreamUrl = `https://sushipass.sushiro.com.hk/api/2.0/remote/groupqueues?region=HK&storeid=${encodeURIComponent(storeId)}`;
  try {
    const res = await fetchWithTimeout(upstreamUrl);
    if (!res.ok) throw new Error(`Upstream HTTP ${res.status}`);
    const rawData = await res.json();
    const normalizedQueue = {
      storeQueue: Array.isArray(rawData?.storeQueue) ? rawData.storeQueue : [],
      boothQueue: Array.isArray(rawData?.boothQueue) ? rawData.boothQueue : [],
      counterQueue: Array.isArray(rawData?.counterQueue) ? rawData.counterQueue : [],
      mixedQueue: Array.isArray(rawData?.mixedQueue) ? rawData.mixedQueue : [],
      reservationQueue: Array.isArray(rawData?.reservationQueue) ? rawData.reservationQueue : [],
      storeCounterQueue: Array.isArray(rawData?.storeCounterQueue) ? rawData.storeCounterQueue : [],
      storeBoothQueue: Array.isArray(rawData?.storeBoothQueue) ? rawData.storeBoothQueue : [],
      reservationCounterQueue: Array.isArray(rawData?.reservationCounterQueue) ? rawData.reservationCounterQueue : [],
      reservationBoothQueue: Array.isArray(rawData?.reservationBoothQueue) ? rawData.reservationBoothQueue : [],
      separateQueue: typeof rawData?.separateQueue === 'number' ? rawData.separateQueue : 0,
    };
    queuesCache.set(storeId, { data: normalizedQueue, timestamp: now });
    return { data: normalizedQueue, cached: false, timestamp: now };
  } catch (err: any) {
    console.error(`[Queue Fetch Error storeId=${storeId}]`, err.message || err);
    if (cached) {
      return {
        data: cached.data,
        cached: true,
        stale: true,
        timestamp: cached.timestamp,
        error: 'Upstream connection failed, returning cached queue',
      };
    }
    const emptyQueue = {
      storeQueue: [], boothQueue: [], counterQueue: [], mixedQueue: [],
      reservationQueue: [], separateQueue: 0,
    };
    return { data: emptyQueue, cached: false, timestamp: now, error: err.message };
  }
}
}
