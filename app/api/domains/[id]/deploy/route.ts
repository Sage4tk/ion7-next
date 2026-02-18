import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertAccountActive, AccountFrozenError } from "@/lib/account";
import { generateSiteHtml } from "@/lib/deploy/html";
import { uploadSiteToS3 } from "@/lib/deploy/s3";
import { ensureDistribution, invalidateCache } from "@/lib/deploy/cloudfront";
import { setDomainCname } from "@/lib/openprovider";
import type { SiteContent } from "@/lib/blocks/types";

async function getAuthedDomain(domainId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 };

  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
    include: { site: true },
  });
  if (!domain) return { error: "Domain not found", status: 404 };
  if (domain.userId !== session.user.id)
    return { error: "Forbidden", status: 403 };

  return { domain, userId: session.user.id };
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getAuthedDomain(id);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  try {
    await assertAccountActive(result.userId);
  } catch (e) {
    if (e instanceof AccountFrozenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  const { domain } = result;

  if (!domain.site) {
    return NextResponse.json(
      { error: "No site found for this domain" },
      { status: 400 },
    );
  }

  try {
    // 1. Generate static HTML
    const content = domain.site.content as unknown as SiteContent;
    const html = generateSiteHtml(content, domain.name);

    // 2. Upload to S3
    await uploadSiteToS3(domain.name, html);

    // 3. Ensure CloudFront distribution exists
    const { distributionId, cloudfrontDomain, certArn } =
      await ensureDistribution(
        domain.name,
        domain.cloudfrontDistId,
        null,
      );

    // 4. Invalidate cache if re-deploying
    if (domain.cloudfrontDistId) {
      await invalidateCache(distributionId);
    }

    // 5. Set DNS CNAME if not already set
    if (!domain.cloudfrontDomain || domain.cloudfrontDomain !== cloudfrontDomain) {
      await setDomainCname(domain.name, cloudfrontDomain);
    }

    // 6. Update domain record
    const now = new Date();
    await prisma.domain.update({
      where: { id: domain.id },
      data: {
        deployedAt: now,
        cloudfrontDistId: distributionId,
        cloudfrontDomain: cloudfrontDomain,
      },
    });

    return NextResponse.json({
      success: true,
      url: `https://www.${domain.name}`,
      deployedAt: now.toISOString(),
    });
  } catch (err) {
    console.error("Deploy failed:", err);
    return NextResponse.json(
      { error: "Deployment failed. Please try again." },
      { status: 500 },
    );
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getAuthedDomain(id);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  const { domain } = result;

  return NextResponse.json({
    deployed: !!domain.deployedAt,
    deployedAt: domain.deployedAt?.toISOString() ?? null,
    url: domain.deployedAt ? `https://www.${domain.name}` : null,
  });
}
