import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getHistory } from './_lib/history.js';
import { redis } from './_lib/redis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const storeId = req.query.storeid as string;
  if (!storeId) {
    return res.status(400).json({ success: false, error: '缺少 storeid 參數' });
  }

  const date = (req.query.date as string) || undefined;

  // Debug: test Redis write with same key format as recordSnapshot
  let redisDebug: any = null;
  try {
    const pong = await redis.ping();
    const dateKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Hong_Kong', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    const histKey = `sushiro:hist:${storeId}:${dateKey}`;
    const existingLen = await redis.lrange(histKey, 0, -1);
    
    // Try a direct write to the same key format
    const testSnap = JSON.stringify({ t: Date.now(), wait: 0, waitingGroup: 0, booth: [], _test: true });
    const newLen = await redis.rpush(histKey, testSnap);
    const afterWrite = await redis.lrange(histKey, 0, -1);
    
    // Clean up test entry
    await redis.ltrim(histKey, 0, -2);
    
    redisDebug = { 
      pong, urlSet: !!process.env.UPSTASH_REDIS_REST_URL, tokenSet: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      histKey, existingLen: existingLen.length, newLen, afterWriteLen: afterWrite.length,
    };
  } catch (err: any) {
    redisDebug = { error: err.message, stack: err.stack?.split('\n').slice(0,3), urlSet: !!process.env.UPSTASH_REDIS_REST_URL, tokenSet: !!process.env.UPSTASH_REDIS_REST_TOKEN };
  }

  try {
    const records = await getHistory(storeId, date);
    
    // Also raw-read to compare
    const dateKey2 = date || new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Hong_Kong', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    const rawKey = `sushiro:hist:${storeId}:${dateKey2}`;
    const rawItems = await redis.lrange(rawKey, 0, -1);
    
    return res.json({
      success: true,
      storeId,
      date: dateKey2,
      records,
      rawLen: rawItems.length,
      rawSample: rawItems.slice(0, 2),
      _debug: redisDebug,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
