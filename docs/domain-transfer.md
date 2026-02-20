# Domain Transfer

## Overview

Users can transfer an existing domain from another registrar into ion7. The transfer is initiated immediately after payment (or free of charge if covered by the 50 AED credit), then takes **5–7 days** to complete at the registry level. The backend polls OpenProvider every 6 hours and activates the domain automatically once the transfer is confirmed.

---

## Prerequisites (User-Facing)

Before initiating a transfer, the user must:

1. **Unlock the domain** at their current registrar (disable the transfer lock / "clientTransferProhibited")
2. **Obtain the EPP auth code** (also called authorization code, transfer key, or auth-info code) from their current registrar's control panel
3. Ensure the domain is **at least 60 days old** — ICANN prohibits transfers within 60 days of registration or a previous transfer
4. Ensure the domain has **not been renewed within the last 60 days** at the current registrar

The transfer includes **1 year of renewal**, so the expiry date is extended once the transfer completes.

---

## Full Transfer Flow

### 1. Form Submission

The user navigates to `/dashboard/domains/transfer`, enters the full domain name (e.g. `mysite.com`) and their EPP auth code, then clicks **Continue to Payment**.

The form splits the input into `name` and `extension` and posts to `POST /api/domains/transfer-checkout`.

### 2. Server Validation (`/api/domains/transfer-checkout`)

The route performs the following checks in order:

| Check | Failure response |
|-------|-----------------|
| User is authenticated | `401 Unauthorized` |
| Account is not frozen | `403` — frozen due to failed payment |
| User has an active plan | `403` — no active plan |
| Domain not already in DB | `409` — already registered in the system |
| OpenProvider confirms domain is registered (not free) | `400` — domain is not registered, use registration instead |
| OpenProvider returns a transfer price | `400` — unable to determine price |

### 3. Free vs Paid Path

After validation, the server applies the **50 AED domain credit** to the transfer price.

```
chargeAmountAed = max(0, priceInEur × 3.97 − 50)
```

#### Free transfer (chargeAmountAed ≤ 0)

- The server calls OpenProvider `POST /domains/transfer` directly with the EPP code
- The domain is created in the database: `status = "pending"`, `openproviderId` set
- The route returns `{ free: true, domainName }` — Stripe is never involved
- The user is redirected to `/dashboard/domains/transfer-success?domain=<domainName>`
- The success page shows the confirmation screen immediately (no polling needed)

#### Paid transfer (chargeAmountAed > 0)

- The server creates a Stripe Checkout session in `payment` mode, charging only the AED amount above the credit
- Stripe metadata includes `{ type: "transfer", domain_name, domain_extension, auth_code, userId }`
- The user is redirected to Stripe to complete payment
- On success, Stripe redirects to `/dashboard/domains/transfer-success?session_id=<id>`
- The success page verifies the session via `/api/stripe/checkout/verify`, then polls `/api/domains?name=<domain>` every 2 seconds until the domain record appears

#### Stripe webhook (`checkout.session.completed`)

For paid transfers, the webhook handler:

1. Detects `session.mode === "payment"` and `metadata.type === "transfer"`
2. Calls `transferDomain(name, extension, authCode)` → OpenProvider `POST /domains/transfer`
3. Creates the domain in the database: `status = "pending"`, `openproviderId` set

### 4. Pending State

Once the transfer is initiated (either path), the domain exists in the database with `status = "pending"`. At this stage:

- The user can view the domain in their dashboard and navigate to its detail page
- A blue **"Transfer in progress"** banner is shown on the domain detail page
- The **Website** and **Emails** tabs are locked (greyed out, not clickable) — these require an active domain with working DNS
- The **Dashboard** and **Billing** tabs remain fully accessible

The lock is lifted automatically once the domain becomes active.

### 5. Transfer Completion (Sync Cron)

The `sync-transfers` cron runs every 6 hours and polls OpenProvider for the status of every `status = "pending"` domain. See [cron-renewal.md](./cron-renewal.md#2-transfer-sync--apicronsync-transfers) for full details.

OpenProvider status values during a transfer:

| Status | Meaning |
|--------|---------|
| `REQ` | Transfer requested — registry processing in progress |
| `SCH` | Scheduled for a future date |
| `ACT` | **Transfer complete** — domain is active |
| `FAI` | **Transfer failed** — see below |

When the cron sees `ACT`:
- Sets `status = "active"` in the database
- Sets `registeredAt = now()`
- Sets `expiresAt` to the expiry date returned by OpenProvider (reflects the 1-year renewal)

### 6. Domain Active

Once `status = "active"`:

- The blue banner disappears on next page load
- Website and Emails tabs become fully accessible
- Domain renewal, website deployment, and email creation all work normally

---

## Transfer Failure

If OpenProvider returns `FAI`, the cron sets `status = "failed"` in the database.

The user sees a red **"Transfer failed"** banner on the domain detail page explaining the common causes:

- Wrong or expired EPP auth code
- Domain is still locked at the current registrar
- 60-day lock period applies (domain registered or transferred too recently)
- Current registrar rejected the transfer request

The domain record remains in the database with `status = "failed"`. The user should be directed to contact support in this case.

---

## Key Files

| File | Purpose |
|------|---------|
| `app/dashboard/domains/transfer/page.tsx` | Transfer form UI |
| `app/api/domains/transfer-checkout/route.ts` | Validates request, applies credit, initiates free transfer or creates Stripe checkout |
| `app/dashboard/domains/transfer-success/page.tsx` | Success screen — handles both free (`?domain=`) and paid (`?session_id=`) paths |
| `app/api/stripe/webhook/route.ts` | Handles `checkout.session.completed` for paid transfers |
| `app/api/cron/sync-transfers/route.ts` | Polls OpenProvider and activates/fails domains |
| `app/dashboard/domains/[id]/layout.tsx` | Shows status badge; locks Website and Emails tabs for non-active domains |
| `app/dashboard/domains/[id]/page.tsx` | Shows pending/failed banners |
| `lib/openprovider.ts` | `transferDomain()`, `getDomainStatus()` |
| `lib/domain-credit.ts` | `calcChargeAmountAed()` — applies the 50 AED credit |

---

## Testing Locally

### Trigger the transfer checkout

```bash
curl -X POST http://localhost:3000/api/domains/transfer-checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: <your_session_cookie>" \
  -d '{"name":"example","extension":"com","authCode":"ABC123XYZ"}'
```

- If free: returns `{ "free": true, "domainName": "example.com" }`
- If paid: returns `{ "url": "https://checkout.stripe.com/..." }`

### Manually run the sync cron

```bash
curl -X GET http://localhost:3000/api/cron/sync-transfers \
  -H "Authorization: Bearer <your_CRON_SECRET>"
```

Response:

```json
{
  "completed": ["example.com"],
  "failed": [],
  "stillPending": ["slow-domain.net"]
}
```
