import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/modules/auth";
import { exportPortfolioReport, InsightServiceError } from "@/lib/insight-client";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const result = await exportPortfolioReport(session.user.id, id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof InsightServiceError && (err.status === 404 || err.status === 429)) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
