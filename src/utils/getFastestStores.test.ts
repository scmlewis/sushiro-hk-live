// src/utils/getFastestStores.test.ts
import { describe, it, expect } from 'vitest';
import { getFastestStores } from './getFastestStores';
import type { SushiroStore } from '../types';

function mk(id: number, over: Partial<SushiroStore>): SushiroStore {
  return {
    id, name: `店${id}`, nameEn: `S${id}`, area: '旺角', address: 'addr',
    latitude: 22.3, longitude: 114.1, wait: 10, waitingGroup: 5,
    storeStatus: 'OPEN', netTicketStatus: 'ONLINE', localTicketingStatus: 'ON',
    waitTimeCap: 60, ...over,
  } as SushiroStore;
}

describe('getFastestStores', () => {
  it('filters to issuing OPEN stores and sorts by wait then groups', () => {
    const stores = [
      mk(1, { wait: 30, waitingGroup: 10 }),
      mk(2, { wait: 5, waitingGroup: 3 }),
      mk(3, { wait: 5, waitingGroup: 1 }),
      mk(4, { storeStatus: 'CLOSED', wait: 0, waitingGroup: 0 }),
      mk(5, { localTicketingStatus: 'OFF', wait: 1, waitingGroup: 1 }),
    ];
    const out = getFastestStores(stores, 3);
    expect(out.map(s => s.id)).toEqual([3, 2, 1]);
  });

  it('prefers nearer store on wait+groups tie when distanceKm present', () => {
    const stores = [
      mk(1, { wait: 5, waitingGroup: 2, distanceKm: 5 }),
      mk(2, { wait: 5, waitingGroup: 2, distanceKm: 1 }),
    ];
    expect(getFastestStores(stores, 2).map(s => s.id)).toEqual([2, 1]);
  });

  it('returns empty when none issuing', () => {
    expect(getFastestStores([mk(1, { storeStatus: 'CLOSED' })])).toEqual([]);
  });
});
