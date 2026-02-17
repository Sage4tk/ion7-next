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

  const { newPlan, interval = "monthly" } = await request.json();

  if (!newPlan || !getPlanById(newPlan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  if (interval !== "monthly" && interval !== "yearly") {
    return NextResponse.json({ error: "Invalid interval" }, { status: 400 });
  }

  const newPriceId = getStripePriceId(newPlan, interval);
  if (!newPriceId) {
    return NextResponse.json({ error: "Plan not configured" }, { status: 500 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, stripeSubscriptionId: true },
  });

  if (!user?.stripeSubscriptionId) {
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

  await stripe.subscriptions.update(user.stripeSubscriptionId, {
    items: [{ id: subscriptionItemId, price: newPriceId }],
    proration_behavior: "create_prorations",
  });

  // Update DB directly for instant UI feedback (webhook also fires as safety net)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { plan: newPlan, billingInterval: interval },
  });

  return NextResponse.json({ success: true, plan: newPlan });
}
