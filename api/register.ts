import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kvGet, kvSet } from './_lib/kv.js';
import { createHash } from 'crypto';

interface RegistrationRequest {
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  storeId: number;
  ticketNumber: number;
}

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

function generateSubscriptionId(endpoint: string): string {
  return createHash('sha256').update(endpoint).digest('hex').slice(0, 16);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://sushiro-hk-live.vercel.app');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ success: false, error: '請求過多，請稍後再試' });
  }

  const body = req.body as RegistrationRequest;

  if (!body?.subscription?.endpoint || !body?.storeId || !body?.ticketNumber) {
    return res.status(400).json({
      success: false,
      error: '缺少必要欄位：subscription, storeId, ticketNumber',
    });
  }

  if (body.storeId < 1 || body.ticketNumber < 1) {
    return res.status(400).json({
      success: false,
      error: 'storeId 和 ticketNumber 必須為正整數',
    });
  }

  try {
    const subId = generateSubscriptionId(body.subscription.endpoint);
    const now = Date.now();
    const TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

    const registration = {
      subscription: body.subscription,
      storeId: body.storeId,
      ticketNumber: body.ticketNumber,
      createdAt: now,
      expiresAt: now + TTL_MS,
    };

    // Save registration
    console.log('[Register] Saving registration for store', body.storeId, 'ticket', body.ticketNumber);
    await kvSet(`notification:${subId}`, registration);
    console.log('[Register] Saved notification:', subId);

    // Update store index
    const storeKey = `notification:store:${body.storeId}`;
    const existingIds = await kvGet<string[]>(storeKey) || [];
    if (!existingIds.includes(subId)) {
      existingIds.push(subId);
      await kvSet(storeKey, existingIds);
    }
    console.log('[Register] Updated store index for store', body.storeId);

    // Update global index
    const globalIndexKey = 'notification:index';
    const storeIds = await kvGet<number[]>(globalIndexKey) || [];
    if (!storeIds.includes(body.storeId)) {
      storeIds.push(body.storeId);
      await kvSet(globalIndexKey, storeIds);
    }
    console.log('[Register] Updated global index');

    return res.json({
      success: true,
      registrationId: subId,
    });
  } catch (err: any) {
    console.error('[Register Error]', err.message || err);
    console.error('[Register Error] Stack:', err.stack);
    return res.status(500).json({
      success: false,
      error: err.message || '註冊失敗，請稍後再試',
    });
  }
}
