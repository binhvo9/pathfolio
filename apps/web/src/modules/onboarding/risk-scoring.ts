import type { RiskBand, IncomeTiltBand } from "@/generated/prisma/client";
import { type Answers, scoreRiskAxis, scoreIncomeAxis } from "./questions";

// RiskScoringModule (docs/diagrams/c4/component-onboarding.md) — turns
// questionnaire answers into risk_score/risk_band and
// income_tilt_score/income_tilt_band. Pure rule-based lookups, no ML,
// per docs/specs/02-risk-questionnaire.md.

function riskBandFor(score: number): RiskBand {
  if (score <= 7) return "CONSERVATIVE";
  if (score <= 15) return "BALANCED";
  if (score <= 22) return "GROWTH";
  return "AGGRESSIVE";
}

function incomeTiltBandFor(score: number): IncomeTiltBand {
  if (score <= 3) return "GROWTH_FOCUSED";
  if (score <= 7) return "BALANCED";
  return "INCOME_FOCUSED";
}

export type ScoringResult = {
  riskScore: number;
  riskBand: RiskBand;
  incomeTiltScore: number;
  incomeTiltBand: IncomeTiltBand;
};

export function scoreQuestionnaire(answers: Answers): ScoringResult {
  const riskScore = scoreRiskAxis(answers);
  const incomeTiltScore = scoreIncomeAxis(answers);

  return {
    riskScore,
    riskBand: riskBandFor(riskScore),
    incomeTiltScore,
    incomeTiltBand: incomeTiltBandFor(incomeTiltScore),
  };
}
