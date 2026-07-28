import { redis } from './redis.js';

function getHkDateKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export async function recordSnapshot(
  storeId: string | number,
  store: { wait?: number; waitingGroup?: number } | null,
  queue: { boothQueue?: string[] } | null
): Promise<void> {
  try {
    const dateKey = getHkDateKey();
    const key = `sushiro:hist:${storeId}:${dateKey}`;
    const snapshot = JSON.stringify({
      t: Date.now(),
      wait: store?.wait ?? 0,
      waitingGroup: store?.waitingGroup ?? 0,
      booth: (queue?.boothQueue || []).slice(-3),
    });
    const len = await redis.rpush(key, snapshot);
    await redis.expire(key, 60 * 60 * 24 * 30);
    await redis.ltrim(key, -576, -1);
  } catch (err: any) {
    console.error(`[History Write Error storeId=${storeId}]`, err.message || err);
  }
}

export async function getHistory(
  storeId: string | number,
  date?: string
): Promise<{ t: number; wait: number; waitingGroup: number; booth: string[] }[]> {
  const dateKey = date || getHkDateKey();
  const key = `sushiro:hist:${storeId}:${dateKey}`;
  try {
    const raw = await redis.lrange(key, 0, -1);
    if (!raw || !Array.isArray(raw) || raw.length === 0) return [];
    return raw.map((item) => {
      try {
        if (typeof item === 'string') return JSON.parse(item);
        if (typeof item === 'object' && item !== null) return item;
        return null;
      } catch {
        return null;
      }
    }).filter(Boolean) as any;
  } catch (err: any) {
    console.error(`[History Read Error storeId=${storeId}]`, err.message || err);
    return [];
  }
}
