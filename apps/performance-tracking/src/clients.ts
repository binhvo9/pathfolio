import type { Allocation } from "@pathfolio/shared";

// Cross-service calls — same trusted-caller headers this service itself
// requires from apps/web, now used the other way (Performance Tracking
// as the caller). docs/specs/06-performance-tracking.md.

const API_KEY = process.env.INTERNAL_API_KEY!;

export type ActivePortfolio = {
  id: string;
  userId: string;
  name: string;
  allocation: Allocation;
};

export async function fetchActivePortfolios(): Promise<ActivePortfolio[]> {
  const res = await fetch(`${process.env.SIMULATION_SERVICE_URL}/internal/active-portfolios`, {
    headers: { "x-internal-api-key": API_KEY },
  });
  if (!res.ok) throw new Error(`Simulation service error: ${res.status}`);
  return (await res.json()) as ActivePortfolio[];
}

// Market Data's response also carries `holdings` per class now (for the
// UI drill-down), but this service only ever reads `changePercent`.
export type PriceQuote = { changePercent: number; asOf: string };
export type LiveAssetClass = "stocks" | "bonds" | "gold" | "crypto" | "cash";

export async function fetchAllPrices(): Promise<Record<LiveAssetClass, PriceQuote>> {
  const res = await fetch(`${process.env.MARKET_DATA_SERVICE_URL}/prices`, {
    headers: { "x-internal-api-key": API_KEY },
  });
  if (!res.ok) throw new Error(`Market Data service error: ${res.status}`);
  return (await res.json()) as Record<LiveAssetClass, PriceQuote>;
}
