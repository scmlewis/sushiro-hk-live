import { describe, it, expect, beforeEach } from 'vitest';
import { loadMyTicket, saveMyTicket, clearMyTicket } from './myTickets';

describe('myTickets', () => {
  beforeEach(() => localStorage.clear());
  it('saves and loads per store', () => {
    saveMyTicket(21, '123');
    expect(loadMyTicket(21)).toBe('123');
    expect(loadMyTicket(22)).toBe('');
  });
  it('rejects invalid on load', () => {
    localStorage.setItem('sushiro_hk_my_tickets_v1', JSON.stringify({ 21: 'TOOLONG123' }));
    expect(loadMyTicket(21)).toBe('');
  });
  it('clears single store', () => {
    saveMyTicket(21, '10');
    saveMyTicket(22, '20');
    clearMyTicket(21);
    expect(loadMyTicket(21)).toBe('');
    expect(loadMyTicket(22)).toBe('20');
  });
});
