import { prisma } from "@/lib/prisma";

export class AccountFrozenError extends Error {
  constructor() {
    super("Account is frozen due to a failed payment");
  }
}

/**
 * Throws AccountFrozenError if the user's account is frozen.
 */
export async function assertAccountActive(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountStatus: true },
  });

  if (user?.accountStatus === "frozen") {
    throw new AccountFrozenError();
  }
}
