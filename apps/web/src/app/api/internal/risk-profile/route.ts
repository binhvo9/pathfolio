import { NextRequest, NextResponse } from "next/server";
import { getUserWithRiskProfile } from "@/repositories/user-repository";

// Internal-only — for other services to read Onboarding data
// (docs/specs/07-insight-ai.md). Same trusted-caller shape as the
// Fastify services' requireInternalCaller, hand-rolled here since this
// route lives in Next.js, not Fastify (@pathfolio/shared's helper is
// Fastify-typed). Onboarding has no separate deployable to call instead —
// it's the modular monolith, this route *is* its internal API.
export async function GET(request: NextRequest) {
  const key = request.headers.get("x-internal-api-key");
  if (key !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id" }, { status: 400 });
  }

  const user = await getUserWithRiskProfile(userId);
  if (!user?.riskProfile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ...user.riskProfile, email: user.email });
}
