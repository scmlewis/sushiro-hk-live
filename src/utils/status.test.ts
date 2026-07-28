import { describe, it, expect } from 'vitest';
import {
  getStoreStatusInfo,
  getTicketStatusInfo,
  getWaitTimeTier,
  getStoreRegion,
  formatGoogleMapsUrl,
  isStoreIssuing,
} from './status';

describe('getStoreStatusInfo', () => {
  it('returns green badge for OPEN', () => {
    const result = getStoreStatusInfo('OPEN');
    expect(result.label).toBe('營業中');
    expect(result.dotColor).toContain('emerald');
  });

  it('returns gray badge for CLOSED', () => {
    const result = getStoreStatusInfo('CLOSED');
    expect(result.label).toBe('休息中 / 閉店');
    expect(result.dotColor).toContain('slate');
  });

  it('returns gray badge for any non-OPEN status', () => {
    const result = getStoreStatusInfo('MAINTENANCE');
    expect(result.label).toBe('休息中 / 閉店');
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
  it('returns 暫停派籌 when store is not OPEN', () => {
    const result = getTicketStatusInfo('ONLINE', 'CLOSED');
    expect(result.label).toBe('暫停派籌');
    expect(result.dotColor).toContain('slate');
  });

  it('returns 派籌中 for MANUAL status when store is OPEN', () => {
    const result = getTicketStatusInfo('MANUAL', 'OPEN');
    expect(result.label).toBe('派籌中');
    expect(result.dotColor).toContain('amber');
  });

  it('returns 派籌中 for ONLINE status when store is OPEN', () => {
    const result = getTicketStatusInfo('ONLINE', 'OPEN');
    expect(result.label).toBe('派籌中');
  });

  it('returns 派籌中 for OPEN status when store is OPEN', () => {
    const result = getTicketStatusInfo('OPEN', 'OPEN');
    expect(result.label).toBe('派籌中');
  });

  it('returns 停止線上派籌 for OFFLINE_MANUAL when store is OPEN (not online issuing)', () => {
    const result = getTicketStatusInfo('OFFLINE_MANUAL', 'OPEN');
    expect(result.label).toBe('停止線上派籌');
  });

  it('returns 停止線上派籌 for empty ticket status when store is OPEN', () => {
    const result = getTicketStatusInfo('', 'OPEN');
    expect(result.label).toBe('停止線上派籌');
  });

  it('returns 停止線上派籌 for null-like ticket status when store is OPEN', () => {
    const result = getTicketStatusInfo(null as unknown as string, 'OPEN');
    expect(result.label).toBe('停止線上派籌');
  });
});

describe('getWaitTimeTier', () => {
  it('returns none tier for closed store regardless of wait', () => {
    const result = getWaitTimeTier(30, 'CLOSED');
    expect(result.tier).toBe('none');
    expect(result.title).toBe('非營業時間');
  });

  it('returns none tier for 0 minutes wait', () => {
    const result = getWaitTimeTier(0);
    expect(result.tier).toBe('none');
    expect(result.title).toContain('即時入座');
  });

  it('returns short tier for wait < 15 minutes', () => {
    const result = getWaitTimeTier(5);
    expect(result.tier).toBe('short');
    expect(result.title).toBe('等候時間短');
  });

  it('returns short tier for 14 minutes wait', () => {
    const result = getWaitTimeTier(14);
    expect(result.tier).toBe('short');
  });

  it('returns medium tier for 15 minutes wait', () => {
    const result = getWaitTimeTier(15);
    expect(result.tier).toBe('medium');
    expect(result.title).toBe('中等輪候');
  });

  it('returns medium tier for 29 minutes wait', () => {
    const result = getWaitTimeTier(29);
    expect(result.tier).toBe('medium');
  });

  it('returns long tier for 30 minutes wait', () => {
    const result = getWaitTimeTier(30);
    expect(result.tier).toBe('long');
    expect(result.title).toBe('輪候較久');
  });

  it('returns long tier for 59 minutes wait', () => {
    const result = getWaitTimeTier(59);
    expect(result.tier).toBe('long');
  });

  it('returns very_long tier for 60 minutes wait', () => {
    const result = getWaitTimeTier(60);
    expect(result.tier).toBe('very_long');
    expect(result.title).toBe('長時間輪候');
  });

  it('returns very_long tier for large wait times', () => {
    const result = getWaitTimeTier(155);
    expect(result.tier).toBe('very_long');
  });

  it('defaults to OPEN store status when not provided', () => {
    const result = getWaitTimeTier(20);
    expect(result.tier).toBe('medium');
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
