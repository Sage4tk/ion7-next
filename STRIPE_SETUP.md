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

In the Stripe Dashboard ([dashboard.stripe.com/test/products](https://dashboard.stripe.com/test/products)), create 3 products:

| Product    | Price   | Billing  |
|------------|---------|----------|
| Starter    | $5/mo   | Recurring, Monthly |
| Pro        | $15/mo  | Recurring, Monthly |
| Business   | $39/mo  | Recurring, Monthly |

After creating each product, click into it and copy the **Price ID** (starts with `price_...`).

Alternatively, use the CLI:

```bash
stripe products create --name="Starter" --default-price-data.unit-amount=500 --default-price-data.currency=usd --default-price-data.recurring.interval=month

stripe products create --name="Pro" --default-price-data.unit-amount=1500 --default-price-data.currency=usd --default-price-data.recurring.interval=month

stripe products create --name="Business" --default-price-data.unit-amount=3900 --default-price-data.currency=usd --default-price-data.recurring.interval=month
```

Each command outputs a `default_price` — that's the price ID.

## 4. Configure the Customer Portal

1. Go to [dashboard.stripe.com/test/settings/billing/portal](https://dashboard.stripe.com/test/settings/billing/portal)
2. Enable the portal and configure:
   - Allow customers to **cancel subscriptions**
   - Allow customers to **switch plans** (add all 3 prices)
3. Save

## 5. Set Environment Variables

Add the following to `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...
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
2. On the choose-plan page, select a plan
3. You'll be redirected to Stripe Checkout
4. Use test card: `4242 4242 4242 4242`, any future expiry, any CVC
5. After payment, you'll land on the success page
6. Click "Go to Dashboard"
7. Use "Manage Subscription" in the dashboard nav to open the Stripe billing portal

## Production Checklist

- [ ] Switch API keys from test (`sk_test_`) to live (`sk_live_`) in production env vars
- [ ] Set up a production webhook endpoint in Stripe Dashboard pointing to `https://yourdomain.com/api/stripe/webhook`
- [ ] Use the production webhook signing secret
- [ ] Remove `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` test key and replace with live key
- [ ] Ensure `NEXTAUTH_URL` is set to your production domain (used for portal return URL)
