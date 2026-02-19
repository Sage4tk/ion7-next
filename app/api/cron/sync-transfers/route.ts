import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDomainStatus } from "@/lib/openprovider";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pendingDomains = await prisma.domain.findMany({
    where: {
      status: "pending",
      openproviderId: { not: null },
    },
  });

  console.log(
    `[cron/sync-transfers] found ${pendingDomains.length} pending transfer(s)`,
  );

  const completed: string[] = [];
  const failed: string[] = [];
  const stillPending: string[] = [];

  for (const domain of pendingDomains) {
    const result = await getDomainStatus(domain.openproviderId!);

    if (!result) {
      console.log(
        `[cron/sync-transfers] ${domain.name} — could not fetch status, skipping`,
      );
      stillPending.push(domain.name);
      continue;
    }

    if (result.status === "ACT") {
      await prisma.domain.update({
        where: { id: domain.id },
        data: {
          status: "active",
          registeredAt: new Date(),
          expiresAt:
            result.expiresAt ??
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
      console.log(
        `[cron/sync-transfers] ${domain.name} transfer completed → expires ${result.expiresAt?.toISOString() ?? "unknown"}`,
      );
      completed.push(domain.name);
    } else if (result.status === "FAI") {
      await prisma.domain.update({
        where: { id: domain.id },
        data: { status: "failed" },
      });
      console.log(`[cron/sync-transfers] ${domain.name} transfer failed`);
      failed.push(domain.name);
    } else {
      console.log(
        `[cron/sync-transfers] ${domain.name} still ${result.status}`,
      );
      stillPending.push(domain.name);
    }
  }

  console.log(
    `[cron/sync-transfers] done — completed: ${completed.length}, failed: ${failed.length}, pending: ${stillPending.length}`,
  );

  return NextResponse.json({ completed, failed, stillPending });
}
