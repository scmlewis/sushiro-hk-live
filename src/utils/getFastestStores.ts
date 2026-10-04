import type { SushiroStore } from '../types';
import { isStoreIssuingTickets } from './status';

export function getFastestStores(stores: SushiroStore[], limit = 3): SushiroStore[] {
  return stores
    .filter((s) => isStoreIssuingTickets(s))
    .sort((a, b) => {
      if (a.wait !== b.wait) return a.wait - b.wait;
      if (a.waitingGroup !== b.waitingGroup) return a.waitingGroup - b.waitingGroup;
      const da = a.distanceKm ?? Infinity;
      const db = b.distanceKm ?? Infinity;
      if (da !== db) return da - db;
      return a.id - b.id;
    })
    .slice(0, limit);
}
