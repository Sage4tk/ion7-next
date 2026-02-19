import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDomains, renewDomain } from "@/lib/openprovider";
import { calcChargeAmountAed } from "@/lib/domain-credit";

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Find all active domains expiring within the next 30 days
  // belonging to users who still have an active plan
  const domains = await prisma.domain.findMany({
    where: {
      status: "active",
      expiresAt: { lte: in30Days },
      openproviderId: { not: null },
      user: { plan: { not: null } },
    },
  });

  console.log(`[cron/renew-domains] found ${domains.length} domain(s) expiring within 30 days`);

  const results = { renewed: [] as string[], skipped: [] as string[], failed: [] as string[] };

  for (const domain of domains) {
    try {
      const dotIndex = domain.name.lastIndexOf(".");
      const name = domain.name.slice(0, dotIndex);
      const extension = domain.name.slice(dotIndex + 1);

      const checkResults = await checkDomains(name, [extension]);
      const priceEur = checkResults[0]?.price ?? null;

      if (!priceEur) {
        console.log(`[cron/renew-domains] no price for ${domain.name}, skipping`);
        results.skipped.push(domain.name);
        continue;
      }

      const chargeAmountAed = calcChargeAmountAed(priceEur);

      if (chargeAmountAed > 0) {
        // Exceeds the 50 AED credit — user must pay the difference, skip auto-renewal
        console.log(`[cron/renew-domains] ${domain.name} exceeds credit (charge: AED ${chargeAmountAed.toFixed(2)}), skipping`);
        results.skipped.push(domain.name);
        continue;
      }

      // Fully covered — renew for free
      await renewDomain(domain.openproviderId!);

      const currentExpiry = domain.expiresAt ?? now;
      const newExpiry = new Date(currentExpiry);
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);

      await prisma.domain.update({
        where: { id: domain.id },
        data: { expiresAt: newExpiry },
      });

      console.log(`[cron/renew-domains] renewed ${domain.name} → expires ${newExpiry.toISOString()}`);
      results.renewed.push(domain.name);
    } catch (err) {
      console.error(`[cron/renew-domains] failed to renew ${domain.name}:`, err);
      results.failed.push(domain.name);
    }
  }

  console.log(`[cron/renew-domains] done — renewed: ${results.renewed.length}, skipped: ${results.skipped.length}, failed: ${results.failed.length}`);

  return NextResponse.json(results);
}
