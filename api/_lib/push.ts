import * as webPush from 'web-push';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@sushiro-hk.vercel.app';

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: Record<string, unknown>
): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('[Push] VAPID keys not configured, skipping push');
    return;
  }

  try {
    await webPush.sendNotification(
      subscription,
      JSON.stringify(payload),
      { TTL: 60 * 5 }
    );
  } catch (err: any) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      console.log('[Push] Subscription expired, should prune');
      throw new Error('SUBSCRIPTION_EXPIRED');
    }
    console.error('[Push] Send failed:', err.message || err);
    throw err;
  }
}
