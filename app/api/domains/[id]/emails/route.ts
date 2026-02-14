import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createEmailAccount, deleteEmailAccount } from "@/lib/zoho";
import { addZohoMxRecords } from "@/lib/openprovider";

const MAX_EMAILS = 10;

async function getAuthedDomain(domainId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 };

  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
    include: { emails: true },
  });
  if (!domain) return { error: "Domain not found", status: 404 };
  if (domain.userId !== session.user.id)
    return { error: "Forbidden", status: 403 };

  return { domain };
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

  return NextResponse.json({ emails: result.domain.emails });
}

export async function POST(
  req: Request,
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

  if (domain.emails.length >= MAX_EMAILS) {
    return NextResponse.json(
      { error: `Maximum of ${MAX_EMAILS} emails reached` },
      { status: 400 },
    );
  }

  const { prefix, password } = (await req.json()) as {
    prefix: string;
    password: string;
  };

  if (!prefix || !password) {
    return NextResponse.json(
      { error: "Email prefix and password are required" },
      { status: 400 },
    );
  }

  const prefixRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?$/;
  if (!prefixRegex.test(prefix)) {
    return NextResponse.json(
      { error: "Invalid email prefix" },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const address = `${prefix}@${domain.name}`;

  const existing = await prisma.email.findUnique({ where: { address } });
  if (existing) {
    return NextResponse.json(
      { error: "Email address already exists" },
      { status: 409 },
    );
  }

  try {
    // Add Zoho MX records on first email creation
    if (domain.emails.length === 0) {
      await addZohoMxRecords(domain.name);
    }

    const zohoAccount = await createEmailAccount(address, password);

    const email = await prisma.email.create({
      data: {
        address,
        zohoAccountId: zohoAccount.zuid,
        domainId: id,
      },
    });

    return NextResponse.json({ email }, { status: 201 });
  } catch (err) {
    console.error("Failed to create email account:", err);
    return NextResponse.json(
      { error: "Failed to create email account" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
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

  const { emailId } = (await req.json()) as { emailId: string };
  if (!emailId) {
    return NextResponse.json(
      { error: "emailId is required" },
      { status: 400 },
    );
  }

  const email = await prisma.email.findUnique({ where: { id: emailId } });
  if (!email || email.domainId !== id) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  try {
    await deleteEmailAccount(email.address);
  } catch (err) {
    console.error("Failed to delete Zoho account:", err);
    // Still delete from DB — Zoho account may already be gone
  }

  await prisma.email.delete({ where: { id: emailId } });

  return NextResponse.json({ success: true });
}
