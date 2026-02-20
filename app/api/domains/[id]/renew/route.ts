import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkDomains, renewDomain } from "@/lib/openprovider";
import { calcChargeAmountAed, DOMAIN_CREDIT_AED, eurToAed } from "@/lib/domain-credit";

// Price-only check — no side effects
export async function GET(
  _req: Request,
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

  const dotIndex = domain.name.lastIndexOf(".");
  const name = domain.name.slice(0, dotIndex);
  const extension = domain.name.slice(dotIndex + 1);

  const results = await checkDomains(name, [extension]);
  const priceEur = results[0]?.price ?? null;

  if (!priceEur) {
    return NextResponse.json({ error: "Unable to determine renewal price." }, { status: 400 });
  }

  const renewalPriceAed = eurToAed(priceEur);
  const chargeAmountAed = calcChargeAmountAed(priceEur);

  return NextResponse.json({
    renewalPriceAed,
    chargeAmountAed,
    creditAmount: DOMAIN_CREDIT_AED,
    isFree: chargeAmountAed <= 0,
  });
}

export async function POST(
  _req: Request,
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
    select: { plan: true },
  });

  // Admin bypass — renew directly without Stripe
  if (user?.plan === "admin") {
    if (!domain.openproviderId) {
      return NextResponse.json(
        { error: "Domain is not registered via OpenProvider" },
        { status: 400 },
      );
    }
    await renewDomain(domain.openproviderId);
    const currentExpiry = domain.expiresAt ?? new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    await prisma.domain.update({
      where: { id },
      data: { expiresAt: newExpiry, status: "active" },
    });
    return NextResponse.json({
      renewed: true,
      free: true,
      newExpiresAt: newExpiry.toISOString(),
    });
  }

  if (!domain.openproviderId) {
    return NextResponse.json(
      { error: "Domain is not registered via OpenProvider" },
      { status: 400 },
    );
  }

  // Parse name and extension from domain.name (e.g. "mysite.com" → "mysite", "com")
  const dotIndex = domain.name.lastIndexOf(".");
  const name = domain.name.slice(0, dotIndex);
  const extension = domain.name.slice(dotIndex + 1);

  // Fetch current renewal price from OpenProvider
  const results = await checkDomains(name, [extension]);
  const domainResult = results[0];
  const renewalPriceEur = domainResult?.price ?? null;

  if (!renewalPriceEur) {
    return NextResponse.json(
      { error: "Unable to determine renewal price. Please contact support." },
      { status: 400 },
    );
  }

  const renewalPriceAed = eurToAed(renewalPriceEur);
  const chargeAmountAed = calcChargeAmountAed(renewalPriceEur);

  // Fully covered by the 50 AED credit — renew for free right now
  if (chargeAmountAed <= 0) {
    await renewDomain(domain.openproviderId);

    const currentExpiry = domain.expiresAt ?? new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);

    await prisma.domain.update({
      where: { id },
      data: { expiresAt: newExpiry, status: "active" },
    });

    return NextResponse.json({
      renewed: true,
      free: true,
      newExpiresAt: newExpiry.toISOString(),
    });
  }

  // Overage: tell the client how much to charge
  return NextResponse.json({
    renewed: false,
    needsPayment: true,
    renewalPriceAed,
    creditAmount: DOMAIN_CREDIT_AED,
    chargeAmountAed,
    currency: "AED",
  });
}
