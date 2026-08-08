import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kvGet, kvSet, kvDel } from './_lib/kv.js';
import { sendPushNotification } from './_lib/push.js';
import { calculateTicketPosition, getNotificationTier } from './_lib/notify-logic.js';
import { getQueueData } from './_lib/cache.js';

const TTL_MS = 4 * 60 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://sushiro-hk-live.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const results = { checked: 0, notified: 0, pruned: 0, errors: 0 };

  try {
    const storeIds = (await kvGet<number[]>('notification:index')) || [];

    for (const storeId of storeIds) {
      const subIds = (await kvGet<string[]>(`notification:store:${storeId}`)) || [];
      if (subIds.length === 0) {
        const updatedStoreIds = storeIds.filter((id) => id !== storeId);
        await kvSet('notification:index', updatedStoreIds);
        continue;
      }

      let queueData;
      try {
        const result = await getQueueData(String(storeId), true);
        queueData = result.data;
      } catch {
        continue;
      }

      const survivingSubIds: string[] = [];

      for (const subId of subIds) {
        results.checked++;
        const reg = await kvGet<{ subscription: any; storeId: number; ticketNumber: number; createdAt: number; expiresAt: number }>(`notification:${subId}`);
        if (!reg) { results.pruned++; continue; }
        if (Date.now() > reg.expiresAt) { await kvDel(`notification:${subId}`); results.pruned++; continue; }

        const position = calculateTicketPosition(reg.ticketNumber, queueData as any);
        const tier = getNotificationTier(position);

        if (tier.shouldNotify) {
          try {
            await sendPushNotification(reg.subscription, {
              title: '壽司郎排隊通知',
              body: tier.message,
              storeId: storeId,
            });
            results.notified++;
          } catch (err: any) {
            if (err.message === 'SUBSCRIPTION_EXPIRED') {
              await kvDel(`notification:${subId}`);
              results.pruned++;
              continue;
            }
            results.errors++;
          }
        }

        if (tier.tier === 'called') {
          await kvDel(`notification:${subId}`);
          results.pruned++;
        } else {
          survivingSubIds.push(subId);
        }
      }

      if (survivingSubIds.length === 0) {
        await kvDel(`notification:store:${storeId}`);
        const updatedStoreIds = storeIds.filter((id) => id !== storeId);
        await kvSet('notification:index', updatedStoreIds);
      } else {
        await kvSet(`notification:store:${storeId}`, survivingSubIds);
      }
    }

    return res.json({ success: true, ...results });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}