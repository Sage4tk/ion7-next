export type BillingInterval = "monthly" | "yearly";

export const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "109 AED",
    yearlyDisplayPrice: "1,090 AED",
    period: " /month",
    yearlyPrice: "1,090 AED /yr",
    description: "Everything you need to get started online.",
    popular: false,
    features: [
      "Access to ION7 Dashboard (1 user account access)",
      "1 Free template access (Customizable)",
      "6 Customizable web pages",
      "Free custom domain credit of 50 AED included. Additional fees apply for higher-priced domains.",
      "Free shared web hosting",
      "Free Email Accounts (Up to 5 accounts)",
      "25GB Storage",
      "Unlimited Bandwidth",
      "Free SSL Certificates",
      "Free Weekly backup",
      "Free 24/7 Client Support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "199 AED",
    yearlyDisplayPrice: "1,990 AED",
    period: " /month",
    yearlyPrice: "1,990 AED /yr",
    description: "For professionals who need more power and flexibility.",
    popular: true,
    features: [
      "Everything in BASIC PLAN",
      "Access to ION7 Dashboard (3 user account access)",
      "Unlimited Access to ION7 website templates (Customizable)",
      "10 Customizable web pages",
      "Free Email Accounts (Up to 10 accounts)",
      "50GB Storage",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "349 AED",
    yearlyDisplayPrice: "3,490 AED",
    period: " /month",
    yearlyPrice: "3,490 AED /yr",
    description: "For teams and businesses that demand the best.",
    popular: false,
    features: [
      "Everything in PRO PLAN",
      "Access to ION7 Dashboard (5 user account access)",
      "Unlimited Access to ION7 website templates (Customizable)",
      "Unlimited Customizable web pages",
      "Free Email Accounts (Up to 50 accounts)",
      "100GB Storage",
    ],
  },
] as const;

export type PlanId = (typeof plans)[number]["id"];

/** Server-only: maps plan ID to Stripe price ID */
export function getStripePriceId(
  planId: string,
  interval: BillingInterval = "monthly",
): string | undefined {
  if (interval === "yearly") {
    const map: Record<string, string | undefined> = {
      basic: process.env.STRIPE_BASIC_YEARLY_PRICE_ID,
      pro: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
      business: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID,
    };
    return map[planId];
  }
  const map: Record<string, string | undefined> = {
    basic: process.env.STRIPE_BASIC_PRICE_ID,
    pro: process.env.STRIPE_PRO_PRICE_ID,
    business: process.env.STRIPE_BUSINESS_PRICE_ID,
  };
  return map[planId];
}

/** Server-only: finds plan by Stripe price ID */
export function getPlanByPriceId(priceId: string) {
  const entries: Record<string, string> = {
    [process.env.STRIPE_BASIC_PRICE_ID!]: "basic",
    [process.env.STRIPE_PRO_PRICE_ID!]: "pro",
    [process.env.STRIPE_BUSINESS_PRICE_ID!]: "business",
    [process.env.STRIPE_BASIC_YEARLY_PRICE_ID!]: "basic",
    [process.env.STRIPE_PRO_YEARLY_PRICE_ID!]: "pro",
    [process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID!]: "business",
  };
  const planId = entries[priceId];
  return planId ? plans.find((p) => p.id === planId) : undefined;
}

export function getPlanById(id: string) {
  return plans.find((p) => p.id === id);
}

/** Maximum email accounts per plan */
export const planEmailLimits: Record<string, number> = {
  basic: 5,
  pro: 10,
  business: 50,
  admin: 50,
};
