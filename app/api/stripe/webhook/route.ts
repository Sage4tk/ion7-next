import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getPlanByPriceId } from "@/lib/plans";
import { registerDomain, transferDomain, renewDomain } from "@/lib/openprovider";
import { deleteEmailAccount } from "@/lib/zoho";
import { disableDistribution } from "@/lib/deploy/cloudfront";
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
          const { type, domain_name, domain_extension, auth_code, userId } =
            session.metadata ?? {};

          console.log(
            `[stripe webhook] domain ${type ?? "registration"} payment: ${domain_name}.${domain_extension} for user ${userId}`,
          );

          if (type === "renewal") {
            // Domain renewal overage payment
            const { domain_id } = session.metadata ?? {};

            if (domain_id) {
              const domain = await prisma.domain.findUnique({ where: { id: domain_id } });

              if (domain?.openproviderId) {
                await renewDomain(domain.openproviderId);

                const currentExpiry = domain.expiresAt ?? new Date();
                const newExpiry = new Date(currentExpiry);
                newExpiry.setFullYear(newExpiry.getFullYear() + 1);

                await prisma.domain.update({
                  where: { id: domain_id },
                  data: { expiresAt: newExpiry, status: "active" },
                });

                console.log(`[stripe webhook] domain ${domain.name} renewed successfully`);
              }
            }
          } else if (domain_name && domain_extension && userId) {
            const fullDomain = `${domain_name}.${domain_extension}`;

            if (type === "transfer") {
              // Domain transfer payment — initiate transfer via OpenProvider
              const result = await transferDomain(domain_name, domain_extension, auth_code!);

              await prisma.domain.create({
                data: {
                  name: fullDomain,
                  status: "pending",
                  openproviderId: result.id,
                  userId,
                },
              });

              console.log(`[stripe webhook] domain transfer initiated for ${fullDomain}`);
            } else {
              // Domain registration payment
              const result = await registerDomain(domain_name, domain_extension);

              await prisma.domain.create({
                data: {
                  name: fullDomain,
                  status: "active",
                  openproviderId: result.id,
                  registeredAt: new Date(),
                  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                  userId,
                },
              });

              console.log(`[stripe webhook] domain ${fullDomain} registered successfully`);
            }
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
          const user = await prisma.user.findUnique({
            where: { stripeCustomerId: customerId },
            include: { domains: { include: { emails: true } } },
          });

          if (user) {
            for (const domain of user.domains) {
              // Disable CloudFront distribution (take website offline)
              if (domain.cloudfrontDistId) {
                try {
                  await disableDistribution(domain.cloudfrontDistId);
                  console.log(`[stripe webhook] disabled CloudFront for ${domain.name}`);
                } catch (err) {
                  console.error(`[stripe webhook] CloudFront disable failed for ${domain.name}:`, err);
                }
              }

              // Delete Zoho email accounts
              for (const email of domain.emails) {
                try {
                  await deleteEmailAccount(email.address);
                } catch (err) {
                  console.error(`[stripe webhook] Zoho delete failed for ${email.address}:`, err);
                }
              }

              // Delete email records from DB
              if (domain.emails.length > 0) {
                await prisma.email.deleteMany({ where: { domainId: domain.id } });
              }
            }
          }

          await prisma.user.update({
            where: { stripeCustomerId: customerId },
            data: { plan: null, stripeSubscriptionId: null },
          });

          console.log(`[stripe webhook] cleaned up account for customer ${customerId}`);
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
