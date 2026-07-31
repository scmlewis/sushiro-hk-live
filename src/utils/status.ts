import { SushiroStore, GroupQueue } from '../types';

export interface StatusBadge {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
}

export function getStoreStatusInfo(status: string): StatusBadge {
  const isUp = status === 'OPEN';
  if (isUp) {
    return {
      label: '營業中',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      borderColor: 'border-emerald-500/20',
      dotColor: 'bg-emerald-500',
    };
  }
  return {
    label: '非營業中',
    bgColor: 'bg-slate-500/10',
    textColor: 'text-slate-600 dark:text-slate-400',
    borderColor: 'border-slate-500/20',
    dotColor: 'bg-slate-400',
  };
}

export function isLocalTicketingOff(localTicketingStatus: string): boolean {
  return (localTicketingStatus || '').toUpperCase() === 'OFF';
}

export function isStoreIssuing(netTicketStatus: string, storeStatus: string, localTicketingStatus = 'ON'): boolean {
  if (storeStatus !== 'OPEN') return false;
  if (isLocalTicketingOff(localTicketingStatus)) return false;
  const statusUpper = (netTicketStatus || '').toUpperCase();
  return statusUpper === 'MANUAL' || statusUpper === 'ONLINE' || statusUpper === 'OPEN';
}

export function getTicketStatusInfo(
  netTicketStatus: string,
  storeStatus: string,
  localTicketingStatus = 'ON',
  wait = 0,
  waitingGroup = 0
): StatusBadge {
  const isStopFly = isLocalTicketingOff(localTicketingStatus);

  // 1. 門市非營業中
  if (storeStatus !== 'OPEN') {
    return {
      label: '非營業中',
      bgColor: 'bg-slate-500/10',
      textColor: 'text-slate-500',
      borderColor: 'border-slate-500/20',
      dotColor: 'bg-slate-400',
    };
  }

  // 2. 停籌 (Walk-in stopped — store is open but not accepting walk-ins)
  if (isStopFly) {
    return {
      label: '停籌',
      bgColor: 'bg-[#8b5cf6]/10',
      textColor: 'text-[#8b5cf6] dark:text-violet-400',
      borderColor: 'border-[#8b5cf6]/20',
      dotColor: 'bg-[#8b5cf6]',
    };
  }

  // 3. 非營業中 — no one waiting (defensive: OPEN + ON + 0/0, likely stale upstream data)
  if (wait === 0 && waitingGroup === 0) {
    return {
      label: '非營業中',
      bgColor: 'bg-slate-500/10',
      textColor: 'text-slate-500',
      borderColor: 'border-slate-500/20',
      dotColor: 'bg-slate-400',
    };
  }

  // 4. 現場派籌中 (store is OPEN and walk-in ticketing is active)
  return {
    label: '現場派籌中',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-500/20',
    dotColor: 'bg-emerald-500 animate-pulse',
  };
}

export interface StoreDisplayStatus {
  waitText: string;        // "非營業中" | "停籌" | "X分"
  groupText: string;       // "--" | "X組"
  isClosed: boolean;       // true if store is not servicing
  accentColor: string;     // 'blue' | 'emerald' | 'yellow' | 'orange' | 'red' | 'neutral'
}

export function isStoreServicing(store: SushiroStore): boolean {
  if (store.storeStatus !== 'OPEN') return false;

  // No one waiting — nothing to service
  if (store.wait === 0 && store.waitingGroup === 0) return false;

  // Walk-in stopped but still has queue
  if (isLocalTicketingOff(store.localTicketingStatus)) {
    return store.waitingGroup > 0;
  }

  return true;
}

export function getStoreDisplayStatus(store: SushiroStore): StoreDisplayStatus {
  const isOpen = store.storeStatus === 'OPEN';
  const isStopFly = isLocalTicketingOff(store.localTicketingStatus);

  // 1. 非營業中 (Closed)
  if (!isOpen) {
    return {
      waitText: '非營業中',
      groupText: '--',
      isClosed: true,
      accentColor: 'neutral',
    };
  }

  // 2. 停籌 (Walk-in stopped — store is open but not accepting walk-ins)
  if (isStopFly) {
    return {
      waitText: '停籌',
      groupText: `${store.waitingGroup}組`,
      isClosed: true,
      accentColor: 'purple',
    };
  }

  // 3. 非營業中 — no one waiting (defensive: OPEN + ON + 0/0, likely stale upstream data)
  if (store.wait === 0 && store.waitingGroup === 0) {
    return {
      waitText: '非營業中',
      groupText: '--',
      isClosed: true,
      accentColor: 'neutral',
    };
  }

  // 4. Normal queue
  let accentColor = 'neutral';
  if (store.wait <= 0) {
    accentColor = 'blue';
  } else if (store.wait < 15) {
    accentColor = 'emerald';
  } else if (store.wait < 30) {
    accentColor = 'yellow';
  } else if (store.wait < 60) {
    accentColor = 'orange';
  } else {
    accentColor = 'red';
  }

  return {
    waitText: `${store.wait}分`,
    groupText: `${store.waitingGroup}組`,
    isClosed: false,
    accentColor,
  };
}

export type HKRegion = '港島' | '九龍' | '新界';

export function getStoreRegion(store: { area?: string; address?: string; name?: string }): HKRegion {
  const text = `${store.area || ''} ${store.address || ''} ${store.name || ''}`;

  if (/港島|中西區|灣仔|東區|南區|銅鑼灣|中環|上環|金鐘|西環|堅尼地城|鰂魚涌|太古|柴灣|北角|鴨脷洲|黃竹坑|西營盤|跑馬地/.test(text)) {
    return '港島';
  }

  if (/九龍|油尖旺|深水埗|黃大仙|觀塘|旺角|尖沙咀|油麻地|佐敦|太子|荔枝角|長沙灣|石硤尾|紅磡|土瓜灣|樂富|慈雲山|九龍灣|牛頭角|藍田|黃埔|九龍城|啟德|新蒲崗|美孚|九龍塘/.test(text)) {
    return '九龍';
  }

  return '新界';
}

export function getQueueTicketCount(queue: GroupQueue | null | undefined): number {
  if (!queue) return 0;
  const all = new Set([
    ...(queue.storeQueue || []),
    ...(queue.boothQueue || []),
    ...(queue.counterQueue || []),
    ...(queue.mixedQueue || []),
    ...(queue.reservationQueue || []),
    ...(queue.storeCounterQueue || []),
    ...(queue.storeBoothQueue || []),
    ...(queue.reservationCounterQueue || []),
    ...(queue.reservationBoothQueue || []),
  ]);
  return all.size + (typeof queue.separateQueue === "number" ? queue.separateQueue : 0);
}

export function formatGoogleMapsUrl(lat: number, lng: number, address: string, name: string): string {
  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`壽司郎 ${name} ${address}`)}`;
}

const MARKER_COLORS: Record<string, string> = {
  blue: '#3b82f6',
  emerald: '#10b981',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#aa151b',
  purple: '#8b5cf6',
  neutral: '#6b7280',
};

export function getMarkerColor(accentColor: string): string {
  return MARKER_COLORS[accentColor] || MARKER_COLORS.neutral;
}
