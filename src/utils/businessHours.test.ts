import { describe, it, expect } from 'vitest';
import { getBusinessHours, isWithinBusinessHours } from './businessHours';

// Build a Date whose Asia/Hong_Kong wall-clock is the given weekday/hour/minute.
// 2026-08-02 (2026-07-32 in UTC arithmetic) is a Sunday.
function hkDate(weekday: number, hour: number, minute: number): Date {
  const sundayUtc = Date.UTC(2026, 7, 2, 0, 0, 0);
  const utc = sundayUtc + weekday * 86400000 + (hour - 8) * 3600000 + minute * 60000;
  return new Date(utc);
}

describe('getBusinessHours', () => {
  it('returns default hours for unknown store', () => {
    expect(getBusinessHours(999)).toEqual({ open: 630, close: 1320 });
  });

  it('returns weekend extension for store 18 (銅鑼灣廣場2期店)', () => {
    expect(getBusinessHours(18)).toEqual({ open: 630, close: 1320, closeFriSat: 1350 });
  });
});

describe('isWithinBusinessHours', () => {
  it('returns true within default hours (Sunday 12:00)', () => {
    expect(isWithinBusinessHours(999, hkDate(0, 12, 0))).toBe(true);
  });

  it('returns false before opening (Sunday 10:29)', () => {
    expect(isWithinBusinessHours(999, hkDate(0, 10, 29))).toBe(false);
  });

  it('returns true exactly at opening (Sunday 10:30)', () => {
    expect(isWithinBusinessHours(999, hkDate(0, 10, 30))).toBe(true);
  });

  it('returns true at 21:59 (Sunday)', () => {
    expect(isWithinBusinessHours(999, hkDate(0, 21, 59))).toBe(true);
  });

  it('returns false at closing time (Sunday 22:00)', () => {
    expect(isWithinBusinessHours(999, hkDate(0, 22, 0))).toBe(false);
  });

  it('returns false after closing (Sunday 22:30)', () => {
    expect(isWithinBusinessHours(999, hkDate(0, 22, 30))).toBe(false);
  });

  it('returns true Friday 22:15 for store with Fri/Sat extension', () => {
    expect(isWithinBusinessHours(18, hkDate(5, 22, 15))).toBe(true);
  });

  it('returns true Saturday 22:29 for store with Fri/Sat extension', () => {
    expect(isWithinBusinessHours(18, hkDate(6, 22, 29))).toBe(true);
  });

  it('returns false Saturday 22:30 for store with Fri/Sat extension', () => {
    expect(isWithinBusinessHours(18, hkDate(6, 22, 30))).toBe(false);
  });

  it('returns false Sunday 22:15 for store with Fri/Sat extension (uses normal close)', () => {
    expect(isWithinBusinessHours(18, hkDate(0, 22, 15))).toBe(false);
  });

  it('returns false Monday 22:15 for store with Fri/Sat extension', () => {
    expect(isWithinBusinessHours(18, hkDate(1, 22, 15))).toBe(false);
  });

  it('returns true Monday 21:30 for store with Fri/Sat extension', () => {
    expect(isWithinBusinessHours(18, hkDate(1, 21, 30))).toBe(true);
  });
});
