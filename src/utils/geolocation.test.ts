import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateDistanceKm, getCurrentPosition } from './geolocation';

describe('calculateDistanceKm', () => {
  it('returns Infinity when any coordinate is 0', () => {
    expect(calculateDistanceKm(0, 0, 22.3, 114.2)).toBe(Infinity);
    expect(calculateDistanceKm(22.3, 0, 22.3, 114.2)).toBe(Infinity);
  });

  it('returns 0 for same point', () => {
    expect(calculateDistanceKm(22.3193, 114.1694, 22.3193, 114.1694)).toBe(0);
  });

  it('calculates distance between Central and TST (~2.4km)', () => {
    const dist = calculateDistanceKm(22.2819, 114.1583, 22.2988, 114.1722);
    expect(dist).toBeGreaterThanOrEqual(1.5);
    expect(dist).toBeLessThanOrEqual(4.0);
  });

  it('calculates distance between HK and Tokyo (~2900km)', () => {
    const dist = calculateDistanceKm(22.3193, 114.1694, 35.6895, 139.6917);
    expect(dist).toBeGreaterThan(2500);
    expect(dist).toBeLessThan(3500);
  });

  it('rounds to 1 decimal place', () => {
    const dist = calculateDistanceKm(22.2819, 114.1583, 22.2988, 114.1722);
    expect(dist).toBe(Math.round(dist * 10) / 10);
  });
});

describe('getCurrentPosition', () => {
  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves with coordinates on success', async () => {
    const mockPosition = {
      coords: { latitude: 22.3, longitude: 114.2 },
    };
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    const result = await getCurrentPosition();
    expect(result).toEqual({ latitude: 22.3, longitude: 114.2 });
  });

  it('rejects when geolocation is not supported', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    await expect(getCurrentPosition()).rejects.toThrow('Geolocation is not supported');
  });

  it('retries with low accuracy on first failure', async () => {
    const mockPosition = {
      coords: { latitude: 22.5, longitude: 114.5 },
    };
    let callCount = 0;
    mockGeolocation.getCurrentPosition.mockImplementation((success, _error, _options) => {
      callCount++;
      if (callCount === 1) {
        _error?.({ code: 1, message: 'denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
      } else {
        success(mockPosition);
      }
    });

    const result = await getCurrentPosition();
    expect(result).toEqual({ latitude: 22.5, longitude: 114.5 });
  });
});
