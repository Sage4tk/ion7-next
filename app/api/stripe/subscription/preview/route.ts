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

  const { newPlan } = await request.json();

  if (!newPlan || !getPlanById(newPlan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const newPriceId = getStripePriceId(newPlan);
  if (!newPriceId) {
    return NextResponse.json({ error: "Plan not configured" }, { status: 500 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, stripeSubscriptionId: true, stripeCustomerId: true },
  });

  if (!user?.stripeSubscriptionId || !user.stripeCustomerId) {
    return NextResponse.json(
      { error: "No active subscription" },
      { status: 400 },
    );
  }

  if (user.plan === newPlan) {
    return NextResponse.json(
      { error: "Already on this plan" },
      { status: 400 },
    );
  }

  const subscription = await stripe.subscriptions.retrieve(
    user.stripeSubscriptionId,
  );
  const subscriptionItemId = subscription.items.data[0]?.id;

  if (!subscriptionItemId) {
    return NextResponse.json(
      { error: "Subscription item not found" },
      { status: 500 },
    );
  }

  const upcomingInvoice = await stripe.invoices.createPreview({
    customer: user.stripeCustomerId,
    subscription: user.stripeSubscriptionId,
    subscription_details: {
      items: [{ id: subscriptionItemId, price: newPriceId }],
      proration_behavior: "create_prorations",
    },
  });

  const currentPlanData = user.plan ? getPlanById(user.plan) : null;
  const newPlanData = getPlanById(newPlan)!;

  return NextResponse.json({
    currentPlan: currentPlanData
      ? { id: currentPlanData.id, name: currentPlanData.name }
      : null,
    newPlan: { id: newPlanData.id, name: newPlanData.name },
    immediateAmount: upcomingInvoice.amount_due,
    currency: upcomingInvoice.currency,
    nextBillingDate: upcomingInvoice.period_end,
    lines: upcomingInvoice.lines.data.map((line) => ({
      description: line.description,
      amount: line.amount,
    })),
  });
}
