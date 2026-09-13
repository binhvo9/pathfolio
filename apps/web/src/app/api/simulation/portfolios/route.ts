import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/modules/auth";
import { isValidAllocation } from "@pathfolio/shared";
import { listScenarios, createScenario, SimulationServiceError } from "@/lib/simulation-client";

// Proxy to apps/simulation — see src/lib/simulation-client.ts for why
// this indirection exists (browser never gets the internal API key).

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const portfolios = await listScenarios(session.user.id);
  return NextResponse.json(portfolios);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, allocation } = (await request.json()) as { name?: string; allocation?: unknown };
  if (!name || !isValidAllocation(allocation)) {
    return NextResponse.json({ error: "Invalid name or allocation (must sum to 100)" }, { status: 400 });
  }

  try {
    const portfolio = await createScenario(session.user.id, name, allocation);
    return NextResponse.json(portfolio, { status: 201 });
  } catch (err) {
    if (err instanceof SimulationServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
