import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/modules/auth";
import { compareScenarios } from "@/lib/insight-client";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { portfolioIds } = (await request.json()) as { portfolioIds: string[] };
  const result = await compareScenarios(session.user.id, portfolioIds);
  return NextResponse.json(result);
}
