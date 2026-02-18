import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getPlanByPriceId } from "@/lib/plans";
import { registerDomain } from "@/lib/openprovider";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[stripe webhook] event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "payment") {
          // Domain registration payment
          const { domain_name, domain_extension, userId } =
            session.metadata ?? {};

          console.log(
            `[stripe webhook] domain payment: ${domain_name}.${domain_extension} for user ${userId}`,
          );

          if (domain_name && domain_extension && userId) {
            const result = await registerDomain(domain_name, domain_extension);
            const fullDomain = `${domain_name}.${domain_extension}`;

            await prisma.domain.create({
              data: {
                name: fullDomain,
                status: "active",
                openproviderId: result.id,
                registeredAt: new Date(),
                expiresAt: new Date(
                  Date.now() + 365 * 24 * 60 * 60 * 1000,
                ),
                userId,
              },
            });

            console.log(
              `[stripe webhook] domain ${fullDomain} registered successfully`,
            );
          }
        } else {
          // Subscription checkout
          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id;
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : (session.subscription as Stripe.Subscription | null)?.id;

          console.log(`[stripe webhook] customer: ${customerId}, subscription: ${subscriptionId}`);

          if (customerId && subscriptionId) {
            const subscription =
              await stripe.subscriptions.retrieve(subscriptionId);
            const priceId = subscription.items.data[0]?.price.id;
            const plan = priceId ? getPlanByPriceId(priceId) : undefined;

            console.log(`[stripe webhook] priceId: ${priceId}, plan: ${plan?.id}`);

            if (plan) {
              const billingInterval =
                subscription.items.data[0]?.price.recurring?.interval === "year"
                  ? "yearly"
                  : "monthly";
              await prisma.user.update({
                where: { stripeCustomerId: customerId },
                data: {
                  plan: plan.id,
                  billingInterval,
                  stripeSubscriptionId: subscription.id,
                },
              });
              console.log(`[stripe webhook] updated user plan to ${plan.id} (${billingInterval})`);
            } else {
              console.log(`[stripe webhook] no plan found for priceId: ${priceId}`);
              console.log(`[stripe webhook] env price IDs: starter=${process.env.STRIPE_STARTER_PRICE_ID}, pro=${process.env.STRIPE_PRO_PRICE_ID}, business=${process.env.STRIPE_BUSINESS_PRICE_ID}`);
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price.id;
        const plan = priceId ? getPlanByPriceId(priceId) : undefined;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;

        if (plan && customerId) {
          const billingInterval =
            subscription.items.data[0]?.price.recurring?.interval === "year"
              ? "yearly"
              : "monthly";
          const accountStatus =
            subscription.status === "past_due" ? "frozen" : "active";
          await prisma.user.update({
            where: { stripeCustomerId: customerId },
            data: { plan: plan.id, billingInterval, accountStatus },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (customerId) {
          await prisma.user.update({
            where: { stripeCustomerId: customerId },
            data: { accountStatus: "frozen" },
          });
          console.log(`[stripe webhook] froze account for customer ${customerId}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (customerId) {
          await prisma.user.update({
            where: { stripeCustomerId: customerId },
            data: { accountStatus: "active" },
          });
          console.log(`[stripe webhook] reactivated account for customer ${customerId}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;

        if (customerId) {
          await prisma.user.update({
            where: { stripeCustomerId: customerId },
            data: { plan: null, stripeSubscriptionId: null },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error(`[stripe webhook] error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
