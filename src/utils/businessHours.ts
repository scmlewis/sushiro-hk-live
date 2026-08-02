// Static business hours for Sushiro HK stores.
// Times are minutes since midnight in Asia/Hong_Kong (UTC+8).
// Source: https://sushirohk.com.hk (official store list). Most stores run
// 10:30–22:00 daily; a handful extend to 22:30 on Fri/Sat (and PH eves).

export interface BusinessHours {
  open: number;          // minutes since midnight, e.g. 630 = 10:30
  close: number;         // minutes since midnight, e.g. 1320 = 22:00
  closeFriSat?: number;  // optional later close on Fri/Sat
}

export const DEFAULT_HOURS: BusinessHours = { open: 630, close: 1320 };

const STORE_HOURS: Record<number, BusinessHours> = {
  // 屯門市廣場店
  7: { open: 630, close: 1320, closeFriSat: 1350 },
  // 旺角店
  10: { open: 630, close: 1320, closeFriSat: 1350 },
  // 銅鑼灣廣場2期店
  18: { open: 630, close: 1320, closeFriSat: 1350 },
  // 鰂魚涌店
  19: { open: 630, close: 1320, closeFriSat: 1350 },
  // 尖沙咀加連威老道店
  22: { open: 630, close: 1320, closeFriSat: 1350 },
};

export function getBusinessHours(storeId: number): BusinessHours {
  return STORE_HOURS[storeId] || DEFAULT_HOURS;
}

// Is the current HK wall-clock time within the store's business hours?
// HK is fixed at UTC+8 (no DST), so we shift the instant and read UTC getters —
// this stays correct regardless of the viewer's local timezone.
export function isWithinBusinessHours(storeId: number, now: Date): boolean {
  const hours = getBusinessHours(storeId);
  const hk = new Date(now.getTime() + 8 * 3600000);
  // getDay(): 0=Sun ... 5=Fri, 6=Sat
  const day = hk.getUTCDay();
  const close = day === 5 || day === 6 ? (hours.closeFriSat ?? hours.close) : hours.close;
  const mins = hk.getUTCHours() * 60 + hk.getUTCMinutes();
  return mins >= hours.open && mins < close;
}
