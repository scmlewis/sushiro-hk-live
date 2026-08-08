import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStoresData } from './_lib/cache.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://sushiro-hk-live.vercel.app');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const force = req.query.force === 'true';
    const result = await getStoresData(force);
    return res.json({
      success: true,
      count: result.data.length,
      cached: result.cached,
      stale: result.stale || false,
      timestamp: result.timestamp,
      stores: result.data,
    });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      error: '無法連線至壽司郎伺服器，請稍後再試。',
    });
  }
}
