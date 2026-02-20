import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { checkDomains, registerDomain } from "@/lib/openprovider";
import { calcChargeAmountAed } from "@/lib/domain-credit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, extension } = await request.json();

  if (!name || !extension) {
    return NextResponse.json(
      { error: "Name and extension are required" },
      { status: 400 },
    );
  }

  // Verify user has an active plan
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, plan: true, stripeCustomerId: true, accountStatus: true },
  });

  if (user?.accountStatus === "frozen") {
    return NextResponse.json(
      { error: "Account is frozen due to a failed payment" },
      { status: 403 },
    );
  }

  if (!user?.plan) {
    return NextResponse.json(
      { error: "You need an active plan to register domains" },
      { status: 403 },
    );
  }

  const fullDomain = `${name}.${extension}`;

  const existing = await prisma.domain.findUnique({ where: { name: fullDomain } });
  if (existing) {
    return NextResponse.json(
      { error: "Domain is already registered in our system" },
      { status: 409 },
    );
  }

  // Fetch authoritative price from OpenProvider (never trust client-provided price)
  const results = await checkDomains(name, [extension]);
  const domainResult = results[0];

  if (!domainResult || domainResult.status !== "free") {
    return NextResponse.json(
      { error: "Domain is not available for registration" },
      { status: 400 },
    );
  }

  if (!domainResult.price) {
    return NextResponse.json(
      { error: "Unable to determine domain price. Please contact support." },
      { status: 400 },
    );
  }

  const chargeAmountAed = calcChargeAmountAed(domainResult.price);

  // Admin bypass — register directly without Stripe
  if (user.plan === "admin") {
    try {
      const result = await registerDomain(name, extension);
      const domain = await prisma.domain.create({
        data: {
          name: fullDomain,
          status: "active",
          openproviderId: result.id,
          registeredAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          userId: session.user.id,
        },
      });
      return NextResponse.json({ url: `/dashboard/domains/${domain.id}` });
    } catch (err) {
      console.error("[checkout] admin registration failed:", err);
      return NextResponse.json(
        { error: "Failed to register domain. Please try again." },
        { status: 500 },
      );
    }
  }

  // If fully covered by the 50 AED credit, the client should use the free registration route
  if (chargeAmountAed <= 0) {
    return NextResponse.json(
      { error: "This domain is fully covered by your 50 AED credit. No payment needed." },
      { status: 400 },
    );
  }

  // Get or create Stripe customer
  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "aed",
          unit_amount: Math.round(chargeAmountAed * 100),
          product_data: {
            name: `Domain Registration: ${fullDomain}`,
            description: `1 year registration for ${fullDomain} (50 AED credit applied)`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      domain_name: name,
      domain_extension: extension,
      userId: session.user.id,
    },
    success_url: `${request.headers.get("origin")}/dashboard/domains/registration-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${request.headers.get("origin")}/dashboard/domains/search?q=${encodeURIComponent(name)}`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
