import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, extension, price } = await request.json();

  if (!name || !extension || !price) {
    return NextResponse.json(
      { error: "Name, extension, and price are required" },
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

  // Check if domain already exists in our DB
  const existing = await prisma.domain.findUnique({
    where: { name: fullDomain },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Domain is already registered in our system" },
      { status: 409 },
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

  // Create one-time payment checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: Math.round(price * 100),
          product_data: {
            name: `Domain Registration: ${fullDomain}`,
            description: `1 year registration for ${fullDomain}`,
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
