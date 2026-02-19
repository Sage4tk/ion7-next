import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { checkDomains } from "@/lib/openprovider";
import { calcChargeAmountAed } from "@/lib/domain-credit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const domain = await prisma.domain.findUnique({ where: { id } });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }
  if (domain.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, plan: true, stripeCustomerId: true, accountStatus: true },
  });

  if (!user?.plan) {
    return NextResponse.json(
      { error: "You need an active plan to renew domains" },
      { status: 403 },
    );
  }

  if (user.accountStatus === "frozen") {
    return NextResponse.json(
      { error: "Account is frozen due to a failed payment" },
      { status: 403 },
    );
  }

  const dotIndex = domain.name.lastIndexOf(".");
  const name = domain.name.slice(0, dotIndex);
  const extension = domain.name.slice(dotIndex + 1);

  // Re-fetch price server-side (never trust client)
  const results = await checkDomains(name, [extension]);
  const domainResult = results[0];

  if (!domainResult?.price) {
    return NextResponse.json(
      { error: "Unable to determine renewal price." },
      { status: 400 },
    );
  }

  const chargeAmountAed = calcChargeAmountAed(domainResult.price);

  if (chargeAmountAed <= 0) {
    return NextResponse.json(
      { error: "Renewal is fully covered by the 50 AED credit. Use the free renewal route." },
      { status: 400 },
    );
  }

  // Get or create Stripe customer
  let customerId = user?.stripeCustomerId ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user!.email,
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
            name: `Domain Renewal: ${domain.name}`,
            description: `1 year renewal for ${domain.name} (50 AED credit applied)`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "renewal",
      domain_id: id,
      domain_name: name,
      domain_extension: extension,
      userId: session.user.id,
    },
    success_url: `${request.headers.get("origin")}/dashboard/domains/${id}?renewed=1`,
    cancel_url: `${request.headers.get("origin")}/dashboard/domains/${id}`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
