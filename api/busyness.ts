import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBusynessData } from './_lib/busyness-cache.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const storeId = Number(req.query.storeid);
  const name = req.query.name as string;
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (!storeId || !name || isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ success: false, error: '缺少必要參數 (storeid, name, lat, lng)' });
  }

  try {
    const force = req.query.force === 'true';
    const result = await getBusynessData(storeId, name, lat, lng, force);

    return res.json({
      success: true,
      busyness: result.data,
      cached: result.cached,
      timestamp: result.timestamp,
    });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      error: '無法取得人流資料',
      details: err.message,
    });
  }
}
