import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBusynessData } from './busyness-cache.js';

describe('getBusynessData', () => {
  const originalEnv = process.env.GOOGLE_MAPS_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.GOOGLE_MAPS_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.GOOGLE_MAPS_API_KEY;
    } else {
      process.env.GOOGLE_MAPS_API_KEY = originalEnv;
    }
  });

  it('returns null data when API key is missing', async () => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    const result = await getBusynessData(1, '荃灣廣場', 'Tsuen Wan Plaza', 22.37, 114.11);
    expect(result.data).toBeNull();
    expect(result.cached).toBe(false);
  });

  it('calls Google Places API and returns busyness data', async () => {
    const mockNearbyResponse = {
      places: [{
        id: 'ChIJ_test_place_id',
        displayName: { text: 'Sushiro Tsuen Wan' },
        types: ['restaurant'],
        location: { latitude: 22.371, longitude: 114.111 },
      }],
    };

    const today = new Date().getDay();
    const mockDetailsResponse = {
      currentOpeningHours: { busyNow: 65 },
      popularTimes: Array.from({ length: 7 }, (_, i) => ({
        hours: i === today ? [{ hour: 10, busy: 30 }, { hour: 11, busy: 50 }] : [],
      })),
    };

    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNearbyResponse),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDetailsResponse),
      } as Response);

    const result = await getBusynessData(1, '荃灣廣場', 'Tsuen Wan Plaza', 22.37, 114.11);

    expect(result.data).not.toBeNull();
    expect(result.data!.live).toBe(65);
    expect(result.data!.popularTimes).toHaveLength(2);
    expect(result.data!.popularTimes![0].hour).toBe(10);
    expect(result.data!.popularTimes![0].busy).toBe(30);
    expect(result.cached).toBe(false);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('returns cached data on subsequent calls within TTL', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          places: [{
            id: 'ChIJ_cached',
            displayName: { text: 'Sushiro' },
            types: ['restaurant'],
            location: { latitude: 22.39, longitude: 113.97 },
          }],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ currentOpeningHours: { busyNow: 42 } }),
      } as Response);

    const result1 = await getBusynessData(2, '屯門市廣場', 'Tuen Mun Plaza', 22.39, 113.97);
    expect(result1.cached).toBe(false);

    const result2 = await getBusynessData(2, '屯門市廣場', 'Tuen Mun Plaza', 22.39, 113.97);
    expect(result2.cached).toBe(true);
    expect(result2.data!.live).toBe(42);
  });

  it('bypasses cache when forceFresh is true', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          places: [{
            id: 'ChIJ_fresh',
            displayName: { text: 'Sushiro' },
            types: ['restaurant'],
            location: { latitude: 22.44, longitude: 114.03 },
          }],
          currentOpeningHours: { busyNow: 80 },
        }),
      } as Response);

    await getBusynessData(3, '元朗廣場', 'Yuen Long Plaza', 22.44, 114.03);
    await getBusynessData(3, '元朗廣場', 'Yuen Long Plaza', 22.44, 114.03, true);

    // First call: 1 nearbySearch + 1 getDetails = 2
    // Second call: forceFresh bypasses cache, reuses placeId, 1 getDetails = 1
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('returns null when place not found', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ places: [] }),
    } as Response);

    const result = await getBusynessData(99, '不存在的店', 'Nonexistent', 22.30, 114.17);
    expect(result.data).toBeNull();
  });

  it('returns null when Google API returns error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: 'Forbidden' }),
    } as Response);

    const result = await getBusynessData(4, '假的地方', 'Fake Place', 22.30, 114.17);
    expect(result.data).toBeNull();
  });

  it('returns stale cache on fetch error', async () => {
    // First call succeeds
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          places: [{
            id: 'ChIJ_stale',
            displayName: { text: 'Sushiro' },
            types: ['restaurant'],
            location: { latitude: 22.28, longitude: 114.22 },
          }],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ currentOpeningHours: { busyNow: 55 } }),
      } as Response);

    await getBusynessData(5, '太古城中心', 'Taikoo Shing', 22.28, 114.22);

    // Second call fails
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    const result = await getBusynessData(5, '太古城中心', 'Taikoo Shing', 22.28, 114.22, true);
    expect(result.data).not.toBeNull();
    expect(result.data!.live).toBe(55);
  });
});
