import type { Goal } from "@/generated/prisma/client";

// Static question config — docs/specs/02-risk-questionnaire.md. Not a DB
// table: these don't change per-user and don't need to be queried.

export type Answers = {
  goal: Goal;
  timeHorizonYears: number;
  riskTolerance: "SELL_ALL" | "SELL_SOME" | "DO_NOTHING" | "BUY_MORE";
  incomeNeed: "NEED_REGULAR" | "BALANCED" | "LET_IT_GROW";
};

// Point values per answer, split by axis. Additive, no weighting — see
// spec 02's "Scoring" section for why.
const GOAL_INCOME_POINTS: Record<Goal, number> = {
  RETIREMENT: 3,
  HOUSE_DEPOSIT: 1,
  GENERAL_GROWTH: 0,
};

function timeHorizonRiskPoints(years: number): number {
  if (years < 3) return 0;
  if (years <= 7) return 5;
  if (years <= 15) return 10;
  return 15;
}

const RISK_TOLERANCE_POINTS: Record<Answers["riskTolerance"], number> = {
  SELL_ALL: 0,
  SELL_SOME: 5,
  DO_NOTHING: 10,
  BUY_MORE: 15,
};

const INCOME_NEED_POINTS: Record<Answers["incomeNeed"], number> = {
  NEED_REGULAR: 10,
  BALANCED: 5,
  LET_IT_GROW: 0,
};

export function scoreRiskAxis(answers: Answers): number {
  return timeHorizonRiskPoints(answers.timeHorizonYears) + RISK_TOLERANCE_POINTS[answers.riskTolerance];
}

export function scoreIncomeAxis(answers: Answers): number {
  return GOAL_INCOME_POINTS[answers.goal] + INCOME_NEED_POINTS[answers.incomeNeed];
}

// UI-facing question metadata — docs/diagrams/wireframes/onboarding-flow.md
// screens 3-6. Returned as-is by GET /api/onboarding/questionnaire.
export const QUESTION_DEFINITIONS = [
  {
    id: "goal",
    label: "What are you saving for?",
    options: [
      { value: "RETIREMENT", label: "Retirement" },
      { value: "HOUSE_DEPOSIT", label: "House deposit" },
      { value: "GENERAL_GROWTH", label: "General growth" },
    ],
  },
  {
    id: "timeHorizonYears",
    label: "How many years until you need this money?",
    inputType: "slider",
    min: 1,
    max: 30,
  },
  {
    id: "riskTolerance",
    label: "If your portfolio dropped 20% in a month, what would you do?",
    options: [
      { value: "SELL_ALL", label: "Sell everything" },
      { value: "SELL_SOME", label: "Sell some" },
      { value: "DO_NOTHING", label: "Do nothing" },
      { value: "BUY_MORE", label: "Buy more" },
    ],
  },
  {
    id: "incomeNeed",
    label: "Do you need this money to pay you regular income, or should it just grow?",
    options: [
      { value: "NEED_REGULAR", label: "Need regular income" },
      { value: "BALANCED", label: "Balanced" },
      { value: "LET_IT_GROW", label: "Let it grow" },
    ],
  },
] as const;
