// Server-side-only client for apps/performance-tracking, via the API
// Gateway (docs/specs/08-api-gateway.md) — same pattern as
// simulation-client.ts (browser never gets the internal API key).

const BASE_URL = `${process.env.GATEWAY_URL}/performance`;
const API_KEY = process.env.INTERNAL_API_KEY!;

export async function listSnapshots(userId: string, portfolioId: string) {
  const res = await fetch(`${BASE_URL}/portfolios/${portfolioId}/snapshots`, {
    headers: { "x-internal-api-key": API_KEY, "x-user-id": userId },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Performance Tracking service error: ${res.status}`);
  return res.json();
}
