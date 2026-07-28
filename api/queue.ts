import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getQueueData } from './_lib/cache.js';
import { recordSnapshot } from './_lib/history.js';

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

  try {
    const force = req.query.force === 'true';
    const result = await getQueueData(storeId, force);
    console.log(`[Queue] storeId=${storeId} cached=${result.cached} stale=${result.stale || false}`);
    if (!result.cached) {
      console.log(`[Queue] Calling recordSnapshot for storeId=${storeId}`);
      await recordSnapshot(storeId, null, result.data);
      console.log(`[Queue] recordSnapshot completed for storeId=${storeId}`);
    }
    return res.json({
      success: true,
      storeId,
      cached: result.cached,
      stale: result.stale || false,
      timestamp: result.timestamp,
      queue: result.data,
    });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      error: '無法取得該門市籌號資訊',
      details: err.message,
    });
  }
}
