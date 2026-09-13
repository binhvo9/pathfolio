import { prisma } from "@/lib/prisma";
import type { RiskBand, IncomeTiltBand, Goal, Prisma } from "@/generated/prisma/client";
import type { Allocation } from "@pathfolio/shared";

// RiskProfileRepository (docs/diagrams/c4/component-onboarding.md) — the
// only thing allowed to touch the RiskProfile table directly.

export function saveQuestionnaireResult(
  userId: string,
  data: {
    goal: Goal;
    timeHorizonYears: number;
    riskScore: number;
    riskBand: RiskBand;
    incomeTiltScore: number;
    incomeTiltBand: IncomeTiltBand;
    defaultAllocation: Allocation;
  }
) {
  return prisma.riskProfile.update({
    where: { userId },
    data: {
      goal: data.goal,
      timeHorizonYears: data.timeHorizonYears,
      riskScore: data.riskScore,
      riskBand: data.riskBand,
      incomeTiltScore: data.incomeTiltScore,
      incomeTiltBand: data.incomeTiltBand,
      defaultAllocation: data.defaultAllocation as unknown as Prisma.InputJsonValue,
      questionnaireCompletedAt: new Date(),
    },
  });
}
