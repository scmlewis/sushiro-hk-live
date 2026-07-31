# Setup Guide — Ticket Notification System

Before deploying, configure these Vercel environment variables for the notification system to work.

## 1. Generate VAPID Keys

Run in any terminal (not this one):

```bash
npx web-push generate-vapid-keys
```

Copy the **Public Key** and **Private Key** output.

## 2. Create a Vercel KV Store

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Open your `sushiro-hk-live` project
3. Click **Settings** (gear icon, bottom-left of sidebar)
4. In the left panel, scroll to **Storage**
5. Click **Create Database** → **KV**
6. Note the **REST API URL** and **REST API Token** shown after creation

If you don't see "Storage" in the sidebar:
- Make sure you're on the **Settings** page (not General or Analytics)
- Scroll the left sidebar — it's near the bottom, above "General"
- If your plan doesn't support KV, upgrade to any paid Vercel plan

## 3. Configure Environment Variables

In the Vercel dashboard for `sushiro-hk-live`:

1. Go to **Settings** → **Environment Variables**
2. Click **Add New** for each variable below
3. Select **Production**, **Preview**, and **Development** contexts

| Variable Name | Value |
|---|---|
| `KV_REST_API_URL` | From step 2 (REST API URL) |
| `KV_REST_API_TOKEN` | From step 2 (REST API Token) |
| `VAPID_PUBLIC_KEY` | Public key from `web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Private key from `web-push generate-vapid-keys` |
| `VAPID_EMAIL` | `mailto:your-email@example.com` |
| `CRON_SECRET` | Any random secret string |

## 4. Deploy

```bash
vercel --prod
```

## 5. Verify

After deploying:
1. Visit the site and open a store with an active queue
2. Enter a ticket number with groups ahead > 0
3. Click "通知我 / Notify me" and grant notification permission
4. Wait for the cron job to fire (every 5 minutes) or trigger manually via Vercel dashboard → Functions → `/api/notify` → Run

## Troubleshooting

- **Notifications not arriving**: Check Vercel dashboard → Functions → `/api/notify` for errors
- **"Subscription expired" errors**: Normal — stale registrations are pruned automatically
- **KV quota exceeded**: Free tier allows 10K reads/day and 100K writes/month; should be sufficient for this app's scale