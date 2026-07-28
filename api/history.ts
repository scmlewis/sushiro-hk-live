import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getHistory } from './_lib/history.js';

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

  try {
    const records = await getHistory(storeId, date);
    return res.json({
      success: true,
      storeId,
      date: date || new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Hong_Kong',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date()),
      records,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
