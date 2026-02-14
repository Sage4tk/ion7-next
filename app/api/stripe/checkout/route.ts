import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getStripePriceId, getPlanById } from "@/lib/plans";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await request.json();

  if (!plan || !getPlanById(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId = getStripePriceId(plan);
  if (!priceId) {
    return NextResponse.json({ error: "Plan not configured" }, { status: 500 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, stripeCustomerId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

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
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${request.headers.get("origin")}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${request.headers.get("origin")}/choose-plan`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
