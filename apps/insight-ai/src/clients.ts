// Cross-service reads — docs/specs/07-insight-ai.md's "Comparison"
// behavior, step 2. Same trusted-caller headers this service itself
// requires (see @pathfolio/shared's requireInternalCaller), now used as
// the caller against Simulation, Performance Tracking, and apps/web
// (Onboarding's RiskProfile — no separate deployable for that one).

const API_KEY = process.env.INTERNAL_API_KEY!;

function headers(userId: string) {
  return { "x-internal-api-key": API_KEY, "x-user-id": userId };
}

export type Portfolio = {
  id: string;
  name: string;
  allocation: Record<string, number>;
  status: string;
};

export async function fetchPortfolios(userId: string): Promise<Portfolio[]> {
  const res = await fetch(`${process.env.SIMULATION_SERVICE_URL}/portfolios`, { headers: headers(userId) });
  if (!res.ok) throw new Error(`Simulation service error: ${res.status}`);
  return (await res.json()) as Portfolio[];
}

export type Snapshot = { value: number; valueChangePercent: number; takenAt: string };

export async function fetchSnapshots(userId: string, portfolioId: string): Promise<Snapshot[]> {
  const res = await fetch(`${process.env.PERFORMANCE_SERVICE_URL}/portfolios/${portfolioId}/snapshots`, {
    headers: headers(userId),
  });
  if (!res.ok) throw new Error(`Performance Tracking service error: ${res.status}`);
  return (await res.json()) as Snapshot[];
}

export type RiskProfile = {
  email: string;
  goal: string | null;
  riskBand: string | null;
  incomeTiltBand: string | null;
};

export async function fetchRiskProfile(userId: string): Promise<RiskProfile | null> {
  const res = await fetch(`${process.env.WEB_SERVICE_URL}/api/internal/risk-profile`, { headers: headers(userId) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Web service error: ${res.status}`);
  return (await res.json()) as RiskProfile;
}
