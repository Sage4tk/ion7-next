# Domain Auto-Renewal Cron Job

## Overview

The cron job at `app/api/cron/renew-domains` runs daily and automatically renews domains that are expiring within 30 days, as long as the renewal cost is covered by the user's **50 AED credit**. Domains that exceed the credit are skipped — the user is prompted to pay the difference via the domain dashboard.

---

## How It Works

1. Runs every day at midnight UTC
2. Queries the database for domains where:
   - `status = "active"`
   - `expiresAt` is within the next 30 days
   - `openproviderId` is set (registered via OpenProvider)
   - The domain owner has an active plan (`user.plan` is not null)
3. For each domain, fetches the current renewal price from OpenProvider
4. Converts the price from EUR to AED using the fixed rate in `lib/domain-credit.ts`
5. If the renewal price ≤ 50 AED → renews via OpenProvider and updates `expiresAt + 1 year` in the database
6. If the renewal price > 50 AED → logs and skips (user must pay the difference manually)
7. Cancelled users (plan = null) are excluded — their domains are not renewed

---

## Vercel Setup

### 1. Add the cron schedule

The schedule is already defined in `vercel.json` at the root of the project:

```json
{
  "crons": [
    {
      "path": "/api/cron/renew-domains",
      "schedule": "0 0 * * *"
    }
  ]
}
```

`0 0 * * *` runs at **00:00 UTC every day**. Adjust the schedule using standard cron syntax if needed — for example `0 2 * * *` for 02:00 UTC.

> **Note:** Vercel Cron Jobs require a **Pro or Enterprise** plan. They are not available on the Hobby (free) tier.

---

### 2. Set the `CRON_SECRET` environment variable

The route is protected by a bearer token. Vercel automatically injects this token when it calls the route — you just need to define it.

**In the Vercel dashboard:**
1. Go to your project → **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name:** `CRON_SECRET`
   - **Value:** any strong random string (e.g. generated with `openssl rand -hex 32`)
   - **Environment:** Production (and Preview if needed)

Vercel will send `Authorization: Bearer <CRON_SECRET>` as a header on every cron invocation. The route verifies this header and returns `401` for any other caller.

---

### 3. Deploy

Push your changes to the main branch. Once deployed, Vercel will automatically register the cron job based on `vercel.json`. You can confirm it is active under **Project → Cron Jobs** in the Vercel dashboard.

---

## Testing Locally

Vercel Cron Jobs only run in production, but you can trigger the route manually for testing:

```bash
curl -X GET http://localhost:3000/api/cron/renew-domains \
  -H "Authorization: Bearer <your_CRON_SECRET>"
```

The response will be a JSON object summarising what happened:

```json
{
  "renewed": ["example.com", "mysite.net"],
  "skipped": ["expensive.io"],
  "failed": []
}
```

- **renewed** — domains that were auto-renewed for free
- **skipped** — domains that exceeded the 50 AED credit (user must pay) or had no price data
- **failed** — domains where the OpenProvider or database call threw an error (check server logs)

---

## Adjusting the Credit Amount

The 50 AED credit and EUR conversion rate are defined in one place:

```
lib/domain-credit.ts
```

```ts
export const DOMAIN_CREDIT_AED = 50;
export const EUR_TO_AED = 3.97;
```

Changing `DOMAIN_CREDIT_AED` will affect registration, transfer, and renewal pricing across the entire app — no other files need to be updated.

---

## Logs

All cron activity is logged with the `[cron/renew-domains]` prefix. In production, view logs under **Project → Logs** in the Vercel dashboard and filter by that prefix.

Example log output:

```
[cron/renew-domains] found 3 domain(s) expiring within 30 days
[cron/renew-domains] renewed example.com → expires 2027-02-19T00:00:00.000Z
[cron/renew-domains] expensive.io exceeds credit (charge: AED 23.50), skipping
[cron/renew-domains] done — renewed: 1, skipped: 1, failed: 0
```
