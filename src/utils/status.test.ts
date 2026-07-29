import { describe, it, expect } from 'vitest';
import {
  getStoreStatusInfo,
  getTicketStatusInfo,
  getStoreDisplayStatus,
  isStoreServicing,
  getStoreRegion,
  formatGoogleMapsUrl,
  isStoreIssuing,
  isLocalTicketingOff,
} from './status';
import type { SushiroStore } from '../types';

describe('getStoreStatusInfo', () => {
  it('returns green badge for OPEN', () => {
    const result = getStoreStatusInfo('OPEN');
    expect(result.label).toBe('營業中');
    expect(result.dotColor).toContain('emerald');
  });

  it('returns gray badge for CLOSED', () => {
    const result = getStoreStatusInfo('CLOSED');
    expect(result.label).toBe('休息');
    expect(result.dotColor).toContain('slate');
  });

  it('returns gray badge for any non-OPEN status', () => {
    const result = getStoreStatusInfo('MAINTENANCE');
    expect(result.label).toBe('休息');
  });
});

describe('isLocalTicketingOff', () => {
  it('returns true for OFF', () => {
    expect(isLocalTicketingOff('OFF')).toBe(true);
  });

  it('returns true for off (lowercase)', () => {
    expect(isLocalTicketingOff('off')).toBe(true);
  });

  it('returns false for ON', () => {
    expect(isLocalTicketingOff('ON')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isLocalTicketingOff('')).toBe(false);
  });

  it('returns false for null-like value', () => {
    expect(isLocalTicketingOff(null as unknown as string)).toBe(false);
  });
});

describe('isStoreIssuing', () => {
  it('returns true for ONLINE when store is OPEN', () => {
    expect(isStoreIssuing('ONLINE', 'OPEN')).toBe(true);
  });

  it('returns true for MANUAL when store is OPEN', () => {
    expect(isStoreIssuing('MANUAL', 'OPEN')).toBe(true);
  });

  it('returns true for OPEN when store is OPEN', () => {
    expect(isStoreIssuing('OPEN', 'OPEN')).toBe(true);
  });

  it('returns false for OFFLINE_MANUAL when store is OPEN', () => {
    expect(isStoreIssuing('OFFLINE_MANUAL', 'OPEN')).toBe(false);
  });

  it('returns false when store is not OPEN', () => {
    expect(isStoreIssuing('ONLINE', 'CLOSED')).toBe(false);
  });

  it('returns false for empty ticket status', () => {
    expect(isStoreIssuing('', 'OPEN')).toBe(false);
  });
});

describe('getTicketStatusInfo', () => {
  it('returns 休息 when store is not OPEN', () => {
    const result = getTicketStatusInfo('ONLINE', 'CLOSED');
    expect(result.label).toBe('休息');
    expect(result.dotColor).toContain('slate');
  });

  it('returns 營業中 for MANUAL status when store is OPEN', () => {
    const result = getTicketStatusInfo('MANUAL', 'OPEN');
    expect(result.label).toBe('營業中');
    expect(result.dotColor).toContain('emerald');
  });

  it('returns 營業中 for ONLINE status when store is OPEN', () => {
    const result = getTicketStatusInfo('ONLINE', 'OPEN');
    expect(result.label).toBe('營業中');
  });

  it('returns 營業中 for OPEN status when store is OPEN', () => {
    const result = getTicketStatusInfo('OPEN', 'OPEN');
    expect(result.label).toBe('營業中');
  });

  it('returns 營業中 for OFFLINE_MANUAL when store is OPEN (online status irrelevant for walk-in)', () => {
    const result = getTicketStatusInfo('OFFLINE_MANUAL', 'OPEN');
    expect(result.label).toBe('營業中');
  });

  it('returns 營業中 for empty ticket status when store is OPEN', () => {
    const result = getTicketStatusInfo('', 'OPEN');
    expect(result.label).toBe('營業中');
  });

  it('returns 營業中 for null-like ticket status when store is OPEN', () => {
    const result = getTicketStatusInfo(null as unknown as string, 'OPEN');
    expect(result.label).toBe('營業中');
  });

  it('returns 停飛 when localTicketingStatus is OFF', () => {
    const result = getTicketStatusInfo('ONLINE', 'OPEN', 'OFF');
    expect(result.label).toBe('停飛');
    expect(result.dotColor).toContain('E21F26');
  });

  it('returns 休息 when store is CLOSED even if localTicketingStatus is OFF', () => {
    const result = getTicketStatusInfo('ONLINE', 'CLOSED', 'OFF');
    expect(result.label).toBe('休息');
  });

  it('returns 停飛 for store with local OFF even if not fully finished', () => {
    const result = getTicketStatusInfo('OFFLINE_MANUAL', 'OPEN', 'OFF', 5, 2);
    expect(result.label).toBe('停飛');
  });

  it('returns 營業中 when localTicketingStatus is ON', () => {
    const result = getTicketStatusInfo('ONLINE', 'OPEN', 'ON');
    expect(result.label).toBe('營業中');
  });

  it('defaults localTicketingStatus to ON when not provided', () => {
    const result = getTicketStatusInfo('ONLINE', 'OPEN');
    expect(result.label).toBe('營業中');
  });
});

describe('isStoreServicing', () => {
  const baseStore: SushiroStore = {
    id: 1,
    name: 'Test',
    nameEn: 'Test',
    area: 'Kowloon',
    address: 'Addr',
    latitude: 0,
    longitude: 0,
    wait: 10,
    waitingGroup: 2,
    storeStatus: 'OPEN',
    netTicketStatus: 'ONLINE',
    localTicketingStatus: 'ON',
    waitTimeCap: 120,
  };

  it('returns false for closed store', () => {
    const store = { ...baseStore, storeStatus: 'CLOSED' };
    expect(isStoreServicing(store)).toBe(false);
  });

  it('returns false for finished store (收工)', () => {
    const store = {
      ...baseStore,
      storeStatus: 'OPEN',
      netTicketStatus: 'OFFLINE_MANUAL',
      localTicketingStatus: 'OFF',
      wait: 0,
      waitingGroup: 0,
    };
    expect(isStoreServicing(store)).toBe(false);
  });

  it('returns false for walk-in stopped store (停飛)', () => {
    const store = {
      ...baseStore,
      storeStatus: 'OPEN',
      netTicketStatus: 'ONLINE',
      localTicketingStatus: 'OFF',
      wait: 15,
      waitingGroup: 3,
    };
    expect(isStoreServicing(store)).toBe(false);
  });

  it('returns true for normal open store', () => {
    expect(isStoreServicing(baseStore)).toBe(true);
  });

  it('returns true for store with active queue even if ticketing is offline', () => {
    const store = {
      ...baseStore,
      netTicketStatus: 'OFFLINE_MANUAL',
      localTicketingStatus: 'ON',
      wait: 10,
      waitingGroup: 2,
    };
    expect(isStoreServicing(store)).toBe(true);
  });
});

describe('getStoreDisplayStatus', () => {
  const baseStore: SushiroStore = {
    id: 1,
    name: 'Test',
    nameEn: 'Test',
    area: 'Kowloon',
    address: 'Addr',
    latitude: 0,
    longitude: 0,
    wait: 0,
    waitingGroup: 0,
    storeStatus: 'CLOSED',
    netTicketStatus: 'OFFLINE_MANUAL',
    localTicketingStatus: 'OFF',
    waitTimeCap: 120,
  };

  it('returns 休息 for non-OPEN store', () => {
    const res = getStoreDisplayStatus({ ...baseStore, storeStatus: 'CLOSED' });
    expect(res.waitText).toBe('休息');
    expect(res.groupText).toBe('--');
    expect(res.isClosed).toBe(true);
    expect(res.accentColor).toBe('neutral');
  });

  it('returns 收工 for OPEN + offline + local OFF + 0 wait + 0 group', () => {
    const res = getStoreDisplayStatus({
      ...baseStore,
      storeStatus: 'OPEN',
      netTicketStatus: 'OFFLINE_MANUAL',
      localTicketingStatus: 'OFF',
      wait: 0,
      waitingGroup: 0,
    });
    expect(res.waitText).toBe('收工');
    expect(res.groupText).toBe('--');
    expect(res.isClosed).toBe(true);
    expect(res.accentColor).toBe('neutral');
  });

  it('returns 停飛 for local OFF when not closed or 收工', () => {
    const res = getStoreDisplayStatus({
      ...baseStore,
      storeStatus: 'OPEN',
      netTicketStatus: 'ONLINE',
      localTicketingStatus: 'OFF',
      wait: 10,
      waitingGroup: 3,
    });
    expect(res.waitText).toBe('停飛');
    expect(res.groupText).toBe('3組');
    expect(res.isClosed).toBe(true);
    expect(res.accentColor).toBe('red');
  });

  it('returns normal queue wait time and groups', () => {
    const res = getStoreDisplayStatus({
      ...baseStore,
      storeStatus: 'OPEN',
      netTicketStatus: 'ONLINE',
      localTicketingStatus: 'ON',
      wait: 15,
      waitingGroup: 4,
    });
    expect(res.waitText).toBe('15分');
    expect(res.groupText).toBe('4組');
    expect(res.isClosed).toBe(false);
  });

  it('maps accentColor correctly based on wait time', () => {
    const getAccent = (wait: number) =>
      getStoreDisplayStatus({
        ...baseStore,
        storeStatus: 'OPEN',
        netTicketStatus: 'ONLINE',
        localTicketingStatus: 'ON',
        wait,
      }).accentColor;

    expect(getAccent(0)).toBe('emerald');
    expect(getAccent(5)).toBe('amber');
    expect(getAccent(20)).toBe('violet');
    expect(getAccent(45)).toBe('orange');
    expect(getAccent(75)).toBe('red');
  });
});

describe('getStoreRegion', () => {
  it('returns 港島 for area containing 沙田 (no — should be 新界)', () => {
    // 沙田 is 新界
    const result = getStoreRegion({ area: '沙田' });
    expect(result).toBe('新界');
  });

  it('returns 港島 for area containing 銅鑼灣', () => {
    const result = getStoreRegion({ area: '銅鑼灣' });
    expect(result).toBe('港島');
  });

  it('returns 港島 for address containing 灣仔', () => {
    const result = getStoreRegion({ address: '灣仔區' });
    expect(result).toBe('港島');
  });

  it('returns 九龍 for area containing 旺角', () => {
    const result = getStoreRegion({ area: '旺角' });
    expect(result).toBe('九龍');
  });

  it('returns 九龍 for name containing 尖沙咀', () => {
    const result = getStoreRegion({ name: '壽司郎 尖沙咀店' });
    expect(result).toBe('九龍');
  });

  it('returns 九龍 for area containing 觀塘', () => {
    const result = getStoreRegion({ area: '觀塘' });
    expect(result).toBe('九龍');
  });

  it('returns 新界 for unknown area', () => {
    const result = getStoreRegion({ area: '未知地區' });
    expect(result).toBe('新界');
  });

  it('returns 新界 for empty input', () => {
    const result = getStoreRegion({});
    expect(result).toBe('新界');
  });

  it('returns 新界 for 屯門', () => {
    const result = getStoreRegion({ area: '屯門' });
    expect(result).toBe('新界');
  });

  it('returns 港島 for 北角', () => {
    const result = getStoreRegion({ area: '北角' });
    expect(result).toBe('港島');
  });
});

describe('formatGoogleMapsUrl', () => {
  it('returns coordinate-based URL when lat/lng provided', () => {
    const url = formatGoogleMapsUrl(22.3193, 114.1694, 'address', 'name');
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=22.3193,114.1694');
  });

  it('returns text-based search URL when lat/lng are 0', () => {
    const url = formatGoogleMapsUrl(0, 0, '旺角彌敦道', '壽司郎旺角');
    expect(url).toContain('query=');
    expect(url).not.toContain('22.3');
  });

  it('returns text-based search URL when lat/lng are falsy', () => {
    const url = formatGoogleMapsUrl(0, 0, '', 'Test Store');
    expect(url).toContain('query=');
  });
});
