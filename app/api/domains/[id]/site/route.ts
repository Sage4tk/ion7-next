import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { presetFactories } from "@/lib/blocks/presets";
import type { PresetType } from "@/lib/blocks/types";
import type { InputJsonValue } from "@/lib/generated/prisma/internal/prismaNamespace";

async function getAuthedDomain(domainId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 };

  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
    include: { site: true },
  });
  if (!domain) return { error: "Domain not found", status: 404 };
  if (domain.userId !== session.user.id) return { error: "Forbidden", status: 403 };

  return { domain };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getAuthedDomain(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ site: result.domain.site });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getAuthedDomain(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (result.domain.site) {
    return NextResponse.json({ error: "Site already exists" }, { status: 409 });
  }

  const { template } = (await req.json()) as { template: string };
  const validPresets: PresetType[] = ["business", "portfolio", "restaurant"];
  if (!validPresets.includes(template as PresetType)) {
    return NextResponse.json({ error: "Invalid preset" }, { status: 400 });
  }

  const content = presetFactories[template as PresetType]();
  const site = await prisma.site.create({
    data: {
      domainId: id,
      template,
      content: content as unknown as InputJsonValue,
    },
  });

  return NextResponse.json({ site }, { status: 201 });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getAuthedDomain(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (!result.domain.site) {
    return NextResponse.json({ error: "No site found" }, { status: 404 });
  }

  const { content } = (await req.json()) as { content: InputJsonValue };

  const site = await prisma.site.update({
    where: { id: result.domain.site.id },
    data: { content },
  });

  return NextResponse.json({ site });
}
