import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { getPlanByPriceId } from "@/lib/plans";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  if (checkoutSession.payment_status !== "paid") {
    return NextResponse.json({ success: false, error: "Payment not completed" }, { status: 400 });
  }

  const subscription = checkoutSession.subscription as import("stripe").Stripe.Subscription;
  const priceId = subscription?.items?.data[0]?.price.id;
  const plan = priceId ? getPlanByPriceId(priceId) : undefined;
  const interval =
    subscription?.items?.data[0]?.price.recurring?.interval === "year"
      ? "yearly"
      : "monthly";

  return NextResponse.json({ success: true, plan: plan?.id ?? null, interval });
}
