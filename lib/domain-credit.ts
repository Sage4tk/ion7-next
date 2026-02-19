// 50 AED domain credit applied to every domain registration, transfer, and annual renewal.
// OpenProvider prices in EUR — we convert to AED for display and Stripe charging.
export const DOMAIN_CREDIT_AED = 50;
export const EUR_TO_AED = 3.97; // 1 EUR ≈ 3.97 AED

export function eurToAed(eur: number): number {
  return Math.round(eur * EUR_TO_AED * 100) / 100;
}

/** Returns how much the user owes in AED after applying the 50 AED credit (0 if fully covered). */
export function calcChargeAmountAed(priceEur: number): number {
  return Math.max(0, eurToAed(priceEur) - DOMAIN_CREDIT_AED);
}
