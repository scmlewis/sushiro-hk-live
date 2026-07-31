import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStoresData, getQueueData } from '../_lib/cache.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowed = ['https://sushiro-hk-live.vercel.app'];
  const origin = req.headers.origin ?? '';
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
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
    return res.status(500).json({ success: false, error: err.message });
  }
}
