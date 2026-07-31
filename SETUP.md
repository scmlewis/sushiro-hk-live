# Setup Guide — Ticket Notification System

Before deploying, configure Upstash Redis and VAPID keys for the notification system to work.

## 1. Create an Upstash Redis Instance

1. Go to [https://console.upstash.com](https://console.upstash.com)
2. Sign in with GitHub
3. Click **Create Database**
4. Choose a region closest to your users (e.g., Asia Pacific for Hong Kong)
5. Note the **REST URL** and **AUTH token**

## 2. Generate VAPID Keys

Run in any terminal (not this one):

```bash
npx web-push generate-vapid-keys
```

Copy the **Public Key** and **Private Key** output.

## 3. Configure Environment Variables in Vercel

In the Vercel dashboard for `sushiro-hk-live`:

1. Go to **Settings** → **Environment Variables**
2. Click **Add New** for each variable below
3. Select **Production**, **Preview**, and **Development** contexts

| Variable Name | Value |
|---|---|
| `KV_REST_API_URL` | Upstash REST URL from step 1 |
| `KV_REST_API_TOKEN` | Upstash AUTH token from step 1 |
| `VAPID_PUBLIC_KEY` | Public key from `web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Private key from `web-push generate-vapid-keys` |
| `VAPID_EMAIL` | `mailto:your-email@example.com` |
| `CRON_SECRET` | Any random secret string |

## 4. Deploy

```bash
vercel --prod
```

## 5. Set Up External Cron (Required for Real-Time Notifications)

Vercel's free (hobby) plan doesn't support frequent cron jobs. Use a free external cron service:

1. Go to [https://cron-job.org](https://cron-job.org) (free, no account needed)
2. Create a new job with URL: `https://sushiqueue.vercel.app/api/notify`
3. Set schedule to: `*/5 * * * *` (every 5 minutes)
4. Optional: Add `Authorization` header: `Bearer <CRON_SECRET>`

## 6. Verify

1. Visit the site and open a store with an active queue
2. Enter a ticket number with groups ahead > 0
3. Click "通知我 / Notify me" and grant notification permission
4. The external cron service will check every 5 minutes and send push notifications when your ticket is close

## Troubleshooting

- **Notifications not arriving**: Check the external cron service logs for errors hitting `/api/notify`
- **"Subscription expired" errors**: Normal — stale registrations are pruned automatically by the notify endpoint
- **KV connection errors**: Verify `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set correctly in the Vercel environment variables