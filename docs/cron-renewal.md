# Domain Cron Jobs

The project runs two scheduled cron jobs for domain lifecycle management, both protected by the same `CRON_SECRET` bearer token and registered in `vercel.json`.

---

## 1. Auto-Renewal — `app/api/cron/renew-domains`

### Overview

Runs daily at midnight UTC. Automatically renews domains expiring within 30 days as long as the renewal cost is covered by the user's **50 AED credit**. Domains that exceed the credit are skipped — the user is prompted to pay the difference via the domain dashboard.

### How It Works

1. Queries the database for domains where:
   - `status = "active"`
   - `expiresAt` is within the next 30 days
   - `openproviderId` is set (registered via OpenProvider)
   - The domain owner has an active plan (`user.plan` is not null)
2. For each domain, fetches the current renewal price from OpenProvider
3. Converts the price from EUR to AED using the fixed rate in `lib/domain-credit.ts`
4. If the renewal price ≤ 50 AED → renews via OpenProvider and updates `expiresAt + 1 year` in the database
5. If the renewal price > 50 AED → logs and skips (user must pay the difference manually)
6. Cancelled users (plan = null) are excluded — their domains are not renewed

### Testing Locally

```bash
curl -X GET http://localhost:3000/api/cron/renew-domains \
  -H "Authorization: Bearer <your_CRON_SECRET>"
```

Response:

```json
{
  "renewed": ["example.com", "mysite.net"],
  "skipped": ["expensive.io"],
  "failed": []
}
```

- **renewed** — domains auto-renewed for free using the 50 AED credit
- **skipped** — domains that exceeded the credit (user must pay) or had no price data
- **failed** — domains where the OpenProvider or database call threw an error (check server logs)

### Logs

Filter by `[cron/renew-domains]` in **Project → Logs** on the Vercel dashboard.

```
[cron/renew-domains] found 3 domain(s) expiring within 30 days
[cron/renew-domains] renewed example.com → expires 2027-02-19T00:00:00.000Z
[cron/renew-domains] expensive.io exceeds credit (charge: AED 23.50), skipping
[cron/renew-domains] done — renewed: 1, skipped: 1, failed: 0
```

### Adjusting the Credit Amount

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

## 2. Transfer Sync — `app/api/cron/sync-transfers`

### Overview

Runs every 6 hours. Polls OpenProvider for the current status of any domain that is still `status = "pending"` in the database (i.e. a transfer that was initiated but not yet confirmed). When OpenProvider reports the transfer as complete, the domain is activated automatically in the database.

### Why Polling Is Needed

OpenProvider does not send webhooks for domain transfer events. Transfers are initiated immediately when the user pays, but the actual registry-level transfer takes **5–7 days** to complete. During that window the domain stays in `status = "pending"` in the database. This cron bridges the gap by periodically asking OpenProvider for the current status.

### OpenProvider Transfer Status Values

| Status | Meaning |
|--------|---------|
| `REQ` | Transfer requested — registry processing in progress |
| `SCH` | Transfer scheduled for a specific future date |
| `ACT` | Transfer complete — domain is active |
| `FAI` | Transfer failed (wrong auth code, domain locked, 60-day rule, etc.) |
| `DEL` | Domain deleted |

### How It Works

1. Queries the database for all domains where `status = "pending"` and `openproviderId` is set
2. For each domain, calls `GET /v1beta/domains/{openproviderId}` on OpenProvider
3. Based on the returned status:
   - **`ACT`** → updates DB: `status = "active"`, `registeredAt = now()`, `expiresAt` = expiry date returned by OpenProvider
   - **`FAI`** → updates DB: `status = "failed"`
   - **`REQ` / `SCH`** → no change, logged as still pending
   - API error → skipped, logged, retried on the next run

### Testing Locally

```bash
curl -X GET http://localhost:3000/api/cron/sync-transfers \
  -H "Authorization: Bearer <your_CRON_SECRET>"
```

Response:

```json
{
  "completed": ["transferred-domain.com"],
  "failed": [],
  "stillPending": ["in-progress-domain.net"]
}
```

- **completed** — domains whose transfer finished; now `status = "active"` in the DB
- **failed** — domains where OpenProvider returned `FAI`; now `status = "failed"` in the DB
- **stillPending** — domains still transferring or where the status could not be fetched

### Logs

Filter by `[cron/sync-transfers]` in **Project → Logs** on the Vercel dashboard.

```
[cron/sync-transfers] found 2 pending transfer(s)
[cron/sync-transfers] transferred-domain.com transfer completed → expires 2027-02-19T00:00:00.000Z
[cron/sync-transfers] in-progress-domain.net still REQ
[cron/sync-transfers] done — completed: 1, failed: 0, pending: 1
```

### What the User Sees

- While `status = "pending"`: a blue "Transfer in progress — typically 5–7 days" banner on the domain detail page
- If `status = "failed"`: a red "Transfer failed" banner listing common causes (wrong auth code, domain locked, 60-day rule)
- Once `status = "active"`: the banner disappears and the domain operates normally

---

## Vercel Setup

Both crons share the same setup. Only needs to be done once.

### 1. Add the cron schedules

Both schedules are defined in `vercel.json` at the root of the project:

```json
{
  "crons": [
    {
      "path": "/api/cron/renew-domains",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/sync-transfers",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

- `0 0 * * *` — renewal runs at **00:00 UTC daily**
- `0 */6 * * *` — transfer sync runs at **00:00, 06:00, 12:00, and 18:00 UTC daily**

> **Note:** Vercel Cron Jobs require a **Pro or Enterprise** plan. They are not available on the Hobby (free) tier.

### 2. Set the `CRON_SECRET` environment variable

Both routes are protected by the same bearer token. Vercel automatically injects this token when it calls the routes — you just need to define it once.

**In the Vercel dashboard:**
1. Go to your project → **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name:** `CRON_SECRET`
   - **Value:** any strong random string (e.g. generated with `openssl rand -hex 32`)
   - **Environment:** Production (and Preview if needed)

Vercel sends `Authorization: Bearer <CRON_SECRET>` on every cron invocation. Both routes verify this header and return `401` for any other caller.

### 3. Deploy

Push your changes to the main branch. Once deployed, Vercel will automatically register both cron jobs from `vercel.json`. You can confirm they are active under **Project → Cron Jobs** in the Vercel dashboard.
