import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { checkDomains } from "@/lib/openprovider";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, extension, authCode } = await request.json();

  if (!name || !extension || !authCode) {
    return NextResponse.json(
      { error: "Domain name, extension, and auth code are required" },
      { status: 400 },
    );
  }

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
      { error: "You need an active plan to transfer domains" },
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

  // Check domain status and get transfer price via OpenProvider
  const results = await checkDomains(name, [extension]);
  const domainResult = results[0];

  if (!domainResult || domainResult.status === "free") {
    return NextResponse.json(
      { error: "This domain is not registered and cannot be transferred. Use domain registration instead." },
      { status: 400 },
    );
  }

  if (!domainResult.price) {
    return NextResponse.json(
      { error: "Unable to determine transfer price for this domain. Please contact support." },
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
          currency: domainResult.currency?.toLowerCase() ?? "eur",
          unit_amount: Math.round(domainResult.price * 100),
          product_data: {
            name: `Domain Transfer: ${fullDomain}`,
            description: `Transfer ${fullDomain} to ion7 (includes 1 year renewal)`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "transfer",
      domain_name: name,
      domain_extension: extension,
      auth_code: authCode,
      userId: session.user.id,
    },
    success_url: `${request.headers.get("origin")}/dashboard/domains/transfer-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${request.headers.get("origin")}/dashboard/domains/transfer`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
