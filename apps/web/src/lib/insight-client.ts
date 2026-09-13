// Server-side-only client for apps/insight-ai, via the API Gateway
// (docs/specs/08-api-gateway.md) — same trusted-caller pattern as the
// other three clients.

const BASE_URL = `${process.env.GATEWAY_URL}/insight`;
const API_KEY = process.env.INTERNAL_API_KEY!;

export class InsightServiceError extends Error {
  constructor(public status: number) {
    super(`Insight/AI service error: ${status}`);
  }
}

export async function compareScenarios(userId: string, portfolioIds: string[]) {
  const res = await fetch(`${BASE_URL}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-api-key": API_KEY, "x-user-id": userId },
    body: JSON.stringify({ portfolioIds }),
  });
  if (!res.ok) throw new InsightServiceError(res.status);
  return res.json();
}

export async function exportPortfolioReport(userId: string, portfolioId: string): Promise<{ url: string }> {
  const res = await fetch(`${BASE_URL}/portfolios/${portfolioId}/export`, {
    method: "POST",
    headers: { "x-internal-api-key": API_KEY, "x-user-id": userId },
  });
  if (!res.ok) throw new InsightServiceError(res.status);
  return res.json();
}

export async function emailPortfolioReport(userId: string, portfolioId: string): Promise<{ sent: true }> {
  const res = await fetch(`${BASE_URL}/portfolios/${portfolioId}/email`, {
    method: "POST",
    headers: { "x-internal-api-key": API_KEY, "x-user-id": userId },
  });
  if (!res.ok) throw new InsightServiceError(res.status);
  return res.json();
}
