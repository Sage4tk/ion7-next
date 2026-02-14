export const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$5",
    period: "/mo",
    description: "Perfect for personal sites and side projects.",
    popular: false,
    features: [
      "1 website",
      "Free .ion7.dev subdomain",
      "1 email account",
      "5 GB storage",
      "SSL certificate",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$15",
    period: "/mo",
    description: "For professionals who need more power and flexibility.",
    popular: true,
    features: [
      "5 websites",
      "Free custom domain",
      "10 email accounts",
      "50 GB storage",
      "SSL certificate",
      "Priority support",
      "Analytics dashboard",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "$39",
    period: "/mo",
    description: "For teams and businesses that demand the best.",
    popular: false,
    features: [
      "Unlimited websites",
      "Free custom domain",
      "Unlimited email accounts",
      "200 GB storage",
      "SSL certificate",
      "24/7 priority support",
      "Advanced analytics",
      "Team collaboration",
    ],
  },
] as const;

export type PlanId = (typeof plans)[number]["id"];

/** Server-only: maps plan ID to Stripe price ID */
export function getStripePriceId(planId: string): string | undefined {
  const map: Record<string, string | undefined> = {
    starter: process.env.STRIPE_STARTER_PRICE_ID,
    pro: process.env.STRIPE_PRO_PRICE_ID,
    business: process.env.STRIPE_BUSINESS_PRICE_ID,
  };
  return map[planId];
}

/** Server-only: finds plan by Stripe price ID */
export function getPlanByPriceId(priceId: string) {
  const entries: Record<string, string> = {
    [process.env.STRIPE_STARTER_PRICE_ID!]: "starter",
    [process.env.STRIPE_PRO_PRICE_ID!]: "pro",
    [process.env.STRIPE_BUSINESS_PRICE_ID!]: "business",
  };
  const planId = entries[priceId];
  return planId ? plans.find((p) => p.id === planId) : undefined;
}

export function getPlanById(id: string) {
  return plans.find((p) => p.id === id);
}
