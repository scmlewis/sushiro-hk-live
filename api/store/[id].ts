import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStoresData, getQueueData } from '../_lib/cache.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://sushiro-hk-live.vercel.app');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const storeId = req.query.id as string;
  if (!storeId) {
    return res.status(400).json({ success: false, error: '缺少門市 ID' });
  }

  try {
    const force = req.query.force === 'true';
    const storesResult = await getStoresData(false);
    const store = storesResult.data.find((s: any) => String(s.id) === String(storeId));
    const queueResult = await getQueueData(storeId, force);

    return res.json({
      success: true,
      store: store || null,
      queue: queueResult.data,
      timestamp: queueResult.timestamp,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: '伺服器錯誤' });
  }
}
