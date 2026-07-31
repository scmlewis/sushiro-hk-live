import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kvGet } from './_lib/kv.js';
import { sendPushNotification } from './_lib/push.js';
import { calculateTicketPosition } from './_lib/notify-logic.js';
import { getQueueData } from './_lib/cache.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const index = await kvGet('notification:index');
    const queue = await getQueueData('7', true);
    const pos = calculateTicketPosition(100, queue.data);
    return res.json({ ok: true, index, queue: !!queue.data, pos });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message, stack: err.stack });
  }
}