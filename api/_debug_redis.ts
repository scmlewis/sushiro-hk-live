import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from './_lib/redis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  try {
    const pong = await redis.ping();
    const testKey = 'sushiro:debug:test';
    await redis.set(testKey, 'ok');
    const val = await redis.get(testKey);
    await redis.del(testKey);
    return res.json({ ok: true, pong, val, urlSet: !!url, tokenSet: !!token });
  } catch (err: any) {
    return res.json({ ok: false, error: err.message, urlSet: !!url, tokenSet: !!token });
  }
}
