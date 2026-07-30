export type StoreStatus = 'OPEN' | 'CLOSED';
export type NetTicketStatus = 'ONLINE' | 'MANUAL' | 'OFFLINE_MANUAL' | 'OPEN';
export type LocalTicketingStatus = 'ON' | 'OFF';

export interface SushiroStore {
  id: number;
  name: string;
  nameEn: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  wait: number;             // estimated wait in minutes
  waitingGroup: number;     // number of groups waiting
  storeStatus: StoreStatus;
  netTicketStatus: NetTicketStatus;
  localTicketingStatus: LocalTicketingStatus;
  waitTimeCap: number;
  distanceKm?: number;      // Calculated client-side if geolocation enabled
}

export interface GroupQueue {
  storeQueue: string[];
  boothQueue: string[];
  counterQueue: string[];
  mixedQueue: string[];
  reservationQueue: string[];
  storeCounterQueue?: string[];
  storeBoothQueue?: string[];
  reservationCounterQueue?: string[];
  reservationBoothQueue?: string[];
  separateQueue?: number;
}

export type StoreQueueMap = Record<number, {
  queue: GroupQueue;
  lastUpdated: number;
  loading?: boolean;
}>;

export type SortOption = 'wait-asc' | 'wait-desc' | 'groups-desc' | 'distance-asc' | 'name-asc' | 'area-asc';

export type ViewMode = 'list' | 'map';

export type TabId = 'all' | 'bookmarks' | 'compare' | 'about';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning' | 'error';
}
