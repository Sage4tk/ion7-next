import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerDomain } from "@/lib/openprovider";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, extension } = body;

  if (!name || !extension) {
    return NextResponse.json(
      { error: "Name and extension are required" },
      { status: 400 }
    );
  }

  // Verify user has a plan
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (!user?.plan) {
    return NextResponse.json(
      { error: "You need an active plan to register domains" },
      { status: 403 }
    );
  }

  const fullDomain = `${name}.${extension}`;

  // Check if domain already exists in our DB
  const existing = await prisma.domain.findUnique({
    where: { name: fullDomain },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Domain is already registered in our system" },
      { status: 409 }
    );
  }

  try {
    const result = await registerDomain(name, extension);

    const domain = await prisma.domain.create({
      data: {
        name: fullDomain,
        status: "active",
        openproviderId: result.id,
        registeredAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        userId: session.user.id,
      },
      select: { id: true, name: true, status: true },
    });

    return NextResponse.json({ domain });
  } catch (err) {
    console.error("Domain registration failed:", err);
    return NextResponse.json(
      { error: "Failed to register domain. Please try again." },
      { status: 500 }
    );
  }
}
