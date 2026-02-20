import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  const { email } = await request.json().catch(() => ({}));

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Always return success — don't reveal whether the email exists
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // Delete any existing token for this email
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    const origin = request.headers.get("origin") ?? process.env.NEXTAUTH_URL;
    const resetUrl = `${origin}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch (err) {
      console.error("[forgot-password] failed to send email:", err);
      // Don't expose the error to the client
    }
  }

  return NextResponse.json({ success: true });
}
