// Server-side-only client for apps/market-data, via the API Gateway
// (docs/specs/08-api-gateway.md). Same trusted-caller pattern as the
// other clients — but Market Data's own auth doesn't need x-user-id
// (prices aren't user data, see docs/specs/05-market-data.md), so only
// the key goes out. The proxy route below it still requires a real
// NextAuth session before calling this, so the drill-down data stays
// behind login even though Market Data itself doesn't check who's asking.

const BASE_URL = `${process.env.GATEWAY_URL}/market-data`;
const API_KEY = process.env.INTERNAL_API_KEY!;

export async function getAllPrices() {
  const res = await fetch(`${BASE_URL}/prices`, {
    headers: { "x-internal-api-key": API_KEY },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Market Data service error: ${res.status}`);
  return res.json();
}
