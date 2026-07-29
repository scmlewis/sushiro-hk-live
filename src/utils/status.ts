import { SushiroStore } from '../types';

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
    label: '休息',
    bgColor: 'bg-slate-500/10',
    textColor: 'text-slate-600 dark:text-slate-400',
    borderColor: 'border-slate-500/20',
    dotColor: 'bg-slate-400',
  };
}

export function isLocalTicketingOff(localTicketingStatus: string): boolean {
  return (localTicketingStatus || '').toUpperCase() === 'OFF';
}

export function isStoreIssuing(netTicketStatus: string, storeStatus: string): boolean {
  if (storeStatus !== 'OPEN') return false;
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
  const isOffline = !isStoreIssuing(netTicketStatus, storeStatus);
  const isFinished = storeStatus === 'OPEN' && isOffline && isStopFly && wait === 0 && waitingGroup === 0;

  // 1. 門市休息
  if (storeStatus !== 'OPEN') {
    return {
      label: '休息',
      bgColor: 'bg-slate-500/10',
      textColor: 'text-slate-500',
      borderColor: 'border-slate-500/20',
      dotColor: 'bg-slate-400',
    };
  }

  // 2. 停飛 (walk-in ticketing stopped — most critical for walk-in users)
  if (isStopFly) {
    return {
      label: '現場停止派籌',
      bgColor: 'bg-[#aa151b]/10',
      textColor: 'text-[#aa151b] dark:text-red-400',
      borderColor: 'border-[#aa151b]/20',
      dotColor: 'bg-[#aa151b]',
    };
  }

  // 3. 收工 (fully stopped — no queues, no ticketing)
  if (isFinished) {
    return {
      label: '已收工',
      bgColor: 'bg-slate-500/10',
      textColor: 'text-slate-500',
      borderColor: 'border-slate-500/20',
      dotColor: 'bg-slate-400',
    };
  }

  // 4. 現場派籌中 (store is OPEN and walk-in ticketing is active)
  return {
    label: '現場派籌',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-500/20',
    dotColor: 'bg-emerald-500 animate-pulse',
  };
}

export interface StoreDisplayStatus {
  waitText: string;        // "休息" | "收工" | "停飛" | "X分"
  groupText: string;       // "--" | "X組"
  isClosed: boolean;       // true if store is not servicing
  accentColor: string;     // 'emerald' | 'amber' | 'violet' | 'orange' | 'red' | 'neutral'
}

export function isStoreServicing(store: SushiroStore): boolean {
  if (store.storeStatus !== 'OPEN') return false;
  const isStopFly = isLocalTicketingOff(store.localTicketingStatus);
  
  // 收工 (Finished) — walk-in stopped and no one waiting
  if (isStopFly && store.wait === 0 && store.waitingGroup === 0) {
    return false;
  }
  
  // 停飛 (Walk-in stopped)
  if (isStopFly) {
    return false;
  }
  
  return true;
}

export function getStoreDisplayStatus(store: SushiroStore): StoreDisplayStatus {
  const isOpen = store.storeStatus === 'OPEN';
  const isStopFly = isLocalTicketingOff(store.localTicketingStatus);

  // 1. 休息 (Closed)
  if (!isOpen) {
    return {
      waitText: '休息',
      groupText: '--',
      isClosed: true,
      accentColor: 'neutral',
    };
  }

  // 2. 收工 (Finished) — walk-in stopped and no one waiting
  if (isStopFly && store.wait === 0 && store.waitingGroup === 0) {
    return {
      waitText: '收工',
      groupText: '--',
      isClosed: true,
      accentColor: 'neutral',
    };
  }

  // 3. 停飛 (Walk-in stopped)
  if (isStopFly) {
    return {
      waitText: '停飛',
      groupText: `${store.waitingGroup}組`,
      isClosed: true,
      accentColor: 'red',
    };
  }

  // 4. Normal queue
  let accentColor = 'neutral';
  if (store.wait <= 0) {
    accentColor = 'emerald';
  } else if (store.wait < 15) {
    accentColor = 'amber';
  } else if (store.wait < 30) {
    accentColor = 'violet';
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

export function formatGoogleMapsUrl(lat: number, lng: number, address: string, name: string): string {
  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`壽司郎 ${name} ${address}`)}`;
}
