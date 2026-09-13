import { NextResponse } from "next/server";
import { auth } from "@/modules/auth";
import { getAllPrices } from "@/lib/market-data-client";

// Proxy to apps/market-data — powers the holdings drill-down on
// /portfolio/[id]. Requires a session even though Market Data's own data
// isn't user-scoped (see src/lib/market-data-client.ts).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const prices = await getAllPrices();
  return NextResponse.json(prices);
}
