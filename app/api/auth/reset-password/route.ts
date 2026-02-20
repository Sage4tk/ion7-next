import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { token, password } = await request.json().catch(() => ({}));

  if (!token || !password) {
    return NextResponse.json(
      { error: "Token and password are required" },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    return NextResponse.json(
      { error: "Invalid or expired reset link" },
      { status: 400 },
    );
  }

  if (resetToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token } });
    return NextResponse.json(
      { error: "This reset link has expired. Please request a new one." },
      { status: 400 },
    );
  }

  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email: resetToken.email },
    data: { password: hashed },
  });

  await prisma.passwordResetToken.delete({ where: { token } });

  return NextResponse.json({ success: true });
}
