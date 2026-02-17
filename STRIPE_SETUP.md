# Stripe Subscription Setup

## 1. Install the Stripe CLI

Download from [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli) or via package manager:

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (scoop)
scoop install stripe
```

Log in:

```bash
stripe login
```

## 2. Get Your API Keys

1. Go to [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`)

## 3. Create Products & Prices

In the Stripe Dashboard ([dashboard.stripe.com/test/products](https://dashboard.stripe.com/test/products)), create 3 products with **monthly** and **yearly** prices each:

### Monthly Prices

| Product  | Price       | Billing            |
|----------|-------------|--------------------|
| Basic    | 109 AED/mo  | Recurring, Monthly |
| Pro      | 199 AED/mo  | Recurring, Monthly |
| Business | 349 AED/mo  | Recurring, Monthly |

### Yearly Prices (10 months — save 2 months)

| Product  | Price          | Billing           |
|----------|----------------|-------------------|
| Basic    | 1,090 AED/yr   | Recurring, Yearly |
| Pro      | 1,990 AED/yr   | Recurring, Yearly |
| Business | 3,490 AED/yr   | Recurring, Yearly |

After creating each price, click into it and copy the **Price ID** (starts with `price_...`).

Alternatively, use the CLI:

```bash
# Monthly prices
stripe products create --name="Basic" \
  --default-price-data.unit-amount=10900 \
  --default-price-data.currency=aed \
  --default-price-data.recurring.interval=month

stripe products create --name="Pro" \
  --default-price-data.unit-amount=19900 \
  --default-price-data.currency=aed \
  --default-price-data.recurring.interval=month

stripe products create --name="Business" \
  --default-price-data.unit-amount=34900 \
  --default-price-data.currency=aed \
  --default-price-data.recurring.interval=month

# Yearly prices (add to existing products)
# First, find your product IDs from the commands above, then:
stripe prices create --product=prod_BASIC_ID \
  --unit-amount=109000 \
  --currency=aed \
  --recurring.interval=year

stripe prices create --product=prod_PRO_ID \
  --unit-amount=199000 \
  --currency=aed \
  --recurring.interval=year

stripe prices create --product=prod_BUSINESS_ID \
  --unit-amount=349000 \
  --currency=aed \
  --recurring.interval=year
```

Each command outputs a price ID (`price_...`).

## 4. Configure the Customer Portal

1. Go to [dashboard.stripe.com/test/settings/billing/portal](https://dashboard.stripe.com/test/settings/billing/portal)
2. Enable the portal and configure:
   - Allow customers to **cancel subscriptions**
   - Allow customers to **switch plans** (add all 6 prices — 3 monthly + 3 yearly)
3. Save

## 5. Set Environment Variables

Add the following to `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Monthly price IDs
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...

# Yearly price IDs
STRIPE_BASIC_YEARLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_BUSINESS_YEARLY_PRICE_ID=price_...
```

The webhook secret is obtained in the next step.

## 6. Set Up Local Webhook Forwarding

In a separate terminal, run:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This prints a webhook signing secret (`whsec_...`). Copy it into `STRIPE_WEBHOOK_SECRET` in `.env.local`.

Keep this terminal running while developing.

## 7. Run the App

```bash
npm run dev
```

## 8. Test the Flow

1. Register or log in
2. On the choose-plan page, toggle between **Monthly** and **Yearly** billing
3. Select a plan — you'll be redirected to Stripe Checkout
4. Use test card: `4242 4242 4242 4242`, any future expiry, any CVC
5. After payment, you'll land on the success page
6. Click "Go to Dashboard"
7. On the billing page, verify you can:
   - See your current plan and billing interval
   - Switch between monthly and yearly for the same plan
   - Upgrade or downgrade to a different plan
   - Preview proration before confirming changes

## How Billing Intervals Work

- The **homepage**, **choose-plan page**, and **billing page** all have a Monthly/Yearly toggle
- Yearly pricing is 10x monthly (2 months free)
- When switching intervals or plans, Stripe handles proration automatically
- The webhook saves the detected `billingInterval` (`"monthly"` or `"yearly"`) to the User record
- The dashboard shows the correct price based on the user's current billing interval

## Production Checklist

- [ ] Switch API keys from test (`sk_test_`) to live (`sk_live_`) in production env vars
- [ ] Create live monthly + yearly prices and update all 6 price ID env vars
- [ ] Set up a production webhook endpoint in Stripe Dashboard pointing to `https://yourdomain.com/api/stripe/webhook`
- [ ] Use the production webhook signing secret
- [ ] Remove `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` test key and replace with live key
- [ ] Ensure `NEXTAUTH_URL` is set to your production domain (used for portal return URL)
