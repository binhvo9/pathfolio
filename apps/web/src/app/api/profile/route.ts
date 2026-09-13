import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/modules/auth";
import { getUserWithRiskProfile, updateUserProfile } from "@/repositories/user-repository";

// ProfileController (docs/diagrams/c4/component-onboarding.md) —
// GET/PATCH /api/profile per docs/specs/01-auth-user-schema.md's API
// section. PATCH only touches name/image — risk fields belong to the
// questionnaire feature (docs/specs/02-risk-questionnaire.md), not here.

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserWithRiskProfile(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, image } = body as { name?: string; image?: string };

  const updated = await updateUserProfile(session.user.id, { name, image });
  return NextResponse.json(updated);
}
