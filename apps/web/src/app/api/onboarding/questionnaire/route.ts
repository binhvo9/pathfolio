import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/modules/auth";
import { QUESTION_DEFINITIONS, type Answers } from "@/modules/onboarding/questions";
import { scoreQuestionnaire } from "@/modules/onboarding/risk-scoring";
import { computeDefaultAllocation } from "@/modules/onboarding/allocation-engine";
import { publishUserOnboarded } from "@/modules/onboarding/event-publisher";
import { saveQuestionnaireResult } from "@/repositories/risk-profile-repository";

// OnboardingController (docs/diagrams/c4/component-onboarding.md) —
// per docs/specs/02-risk-questionnaire.md and 03-allocation-engine.md.
// This is the only route that calls RiskScoringModule,
// AllocationEngineModule, and EventPublisher together, matching
// docs/diagrams/sequence/onboarding.md.

export async function GET() {
  return NextResponse.json({ questions: QUESTION_DEFINITIONS });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const answers = (await request.json()) as Answers;

  const scoring = scoreQuestionnaire(answers);
  const defaultAllocation = computeDefaultAllocation(scoring.riskBand, scoring.incomeTiltBand);

  const riskProfile = await saveQuestionnaireResult(session.user.id, {
    goal: answers.goal,
    timeHorizonYears: answers.timeHorizonYears,
    ...scoring,
    defaultAllocation,
  });

  // Fire-and-forget per the async boundary in docs/diagrams/sequence/onboarding.md
  // — the user gets their result immediately, Simulation seeds a scenario later.
  await publishUserOnboarded({ userId: session.user.id, defaultAllocation });

  return NextResponse.json(riskProfile);
}
