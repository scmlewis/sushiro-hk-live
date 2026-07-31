import { describe, it, expect } from 'vitest';
import { calculateTicketPosition, getNotificationTier } from './notify-logic';

describe('calculateTicketPosition', () => {
  it('returns negative when ticket is already called', () => {
    const queue = { boothQueue: ['10', '11', '12'], counterQueue: ['10', '11'] };
    expect(calculateTicketPosition(10, queue)).toBe(-2);
  });

  it('returns 0 when ticket is next', () => {
    const queue = { boothQueue: ['10', '11'], counterQueue: ['10'] };
    expect(calculateTicketPosition(12, queue)).toBe(1);
  });

  it('returns positive when ticket is ahead', () => {
    const queue = { boothQueue: ['10'], counterQueue: ['10'] };
    expect(calculateTicketPosition(15, queue)).toBe(5);
  });

  it('handles empty queues', () => {
    const queue = { boothQueue: [], counterQueue: [] };
    expect(calculateTicketPosition(5, queue)).toBe(5);
  });

  it('handles reservation numbers (>= 1000) by excluding them', () => {
    const queue = { boothQueue: ['10', '1001'], counterQueue: ['10'] };
    expect(calculateTicketPosition(12, queue)).toBe(2);
  });
});

describe('getNotificationTier', () => {
  it('returns "called" for position <= 0', () => {
    expect(getNotificationTier(0)).toEqual({
      shouldNotify: true,
      tier: 'called',
      position: 0,
      message: '已經到你了！/ Your ticket is being called!',
    });
  });

  it('returns "almost" for position 1', () => {
    expect(getNotificationTier(1)).toEqual({
      shouldNotify: true,
      tier: 'almost',
      position: 1,
      message: '快到你了！/ Almost your turn!',
    });
  });

  it('returns "close" for position 2-3', () => {
    const result2 = getNotificationTier(2);
    const result3 = getNotificationTier(3);
    expect(result2.shouldNotify).toBe(true);
    expect(result2.tier).toBe('close');
    expect(result3.shouldNotify).toBe(true);
    expect(result3.tier).toBe('close');
    expect(result2.message).toContain('2 組');
    expect(result3.message).toContain('3 組');
  });

  it('returns "none" for position > 3', () => {
    expect(getNotificationTier(5)).toEqual({
      shouldNotify: false,
      tier: 'none',
      position: 5,
      message: '',
    });
  });
});
