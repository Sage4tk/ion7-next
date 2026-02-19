import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEmailStorageUsage } from "@/lib/zoho";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const domain = await prisma.domain.findUnique({
    where: { id },
    select: {
      userId: true,
      emails: { select: { id: true, zohoAccountId: true } },
    },
  });

  if (!domain) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (domain.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results = await Promise.allSettled(
    domain.emails.map(async (email) => {
      if (!email.zohoAccountId) return { id: email.id, usage: null };
      const usage = await getEmailStorageUsage(email.zohoAccountId);
      return { id: email.id, usage };
    }),
  );

  const usage: Record<string, { usedMb: number; totalMb: number } | null> = {};
  for (const result of results) {
    if (result.status === "fulfilled") {
      usage[result.value.id] = result.value.usage;
    }
  }

  return NextResponse.json({ usage });
}
