import { prisma } from "@/lib/prisma";

// UserRepository (docs/diagrams/c4/component-onboarding.md) — the only
// thing allowed to touch the User/RiskProfile tables directly. Controllers
// go through this, never `prisma` directly.

export function getUserWithRiskProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { riskProfile: true },
  });
}

export function updateUserProfile(
  userId: string,
  data: { name?: string; image?: string }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}
