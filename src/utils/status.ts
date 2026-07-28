/**
 * Helpers for store status, ticketing status, and wait time tiering
 */

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
    label: '休息中 / 閉店',
    bgColor: 'bg-slate-500/10',
    textColor: 'text-slate-600 dark:text-slate-400',
    borderColor: 'border-slate-500/20',
    dotColor: 'bg-slate-400',
  };
}

export function getTicketStatusInfo(netTicketStatus: string, storeStatus: string): StatusBadge {
  if (storeStatus !== 'OPEN') {
    return {
      label: '暫停派籌',
      bgColor: 'bg-slate-500/10',
      textColor: 'text-slate-500',
      borderColor: 'border-slate-500/20',
      dotColor: 'bg-slate-400',
    };
  }

  const statusUpper = (netTicketStatus || '').toUpperCase();
  const isIssuing = statusUpper.includes('MANUAL') || statusUpper.includes('ONLINE') || statusUpper === 'OPEN';

  if (isIssuing) {
    return {
      label: '派籌中',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-800 dark:text-amber-300',
      borderColor: 'border-amber-500/20',
      dotColor: 'bg-amber-500 animate-pulse',
    };
  }

  return {
    label: '停止線上派籌',
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-700 dark:text-rose-400',
    borderColor: 'border-rose-500/20',
    dotColor: 'bg-rose-500',
  };
}

export interface WaitTimeTier {
  tier: 'none' | 'short' | 'long';
  title: string;
  badgeBg: string;
  badgeText: string;
  borderAccent: string;
  cardHighlight: string;
}

export function getWaitTimeTier(waitMinutes: number, storeStatus = 'OPEN'): WaitTimeTier {
  if (storeStatus !== 'OPEN') {
    return {
      tier: 'none',
      title: '非營業時間',
      badgeBg: 'bg-slate-100 dark:bg-slate-800',
      badgeText: 'text-slate-600 dark:text-slate-400',
      borderAccent: 'border-slate-200 dark:border-slate-800',
      cardHighlight: 'border-l-4 border-l-slate-400',
    };
  }

  if (waitMinutes <= 0) {
    return {
      tier: 'none',
      title: '即時入座 / 無需輪候',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      borderAccent: 'border-emerald-300 dark:border-emerald-800',
      cardHighlight: 'border-l-4 border-l-emerald-500',
    };
  }

  if (waitMinutes < 15) {
    return {
      tier: 'short',
      title: '等候時間短',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
      badgeText: 'text-amber-800 dark:text-amber-300',
      borderAccent: 'border-amber-300 dark:border-amber-800',
      cardHighlight: 'border-l-4 border-l-amber-500',
    };
  }

  return {
    tier: 'long',
    title: '輪候較久',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-800 dark:text-rose-300',
    borderAccent: 'border-rose-300 dark:border-rose-800',
    cardHighlight: 'border-l-4 border-l-red-600',
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
