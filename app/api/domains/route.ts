import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const domain = await prisma.domain.findFirst({
    where: { name, userId: session.user.id },
    select: { id: true, name: true },
  });

  if (!domain) {
    return NextResponse.json({ domain: null });
  }

  return NextResponse.json({ domain });
}
