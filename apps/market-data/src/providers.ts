// External price providers — docs/specs/05-market-data.md. This module
// is the ONLY place allowed to call Finnhub/CoinGecko directly; routes.ts
// always goes through prices.ts (cache + rate limit), never here directly.

export type PriceQuote = {
  symbol: string;
  price: number;
  changePercent: number;
  asOf: string;
};

export async function fetchFinnhubQuote(symbol: string): Promise<PriceQuote> {
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Finnhub error for ${symbol}: ${res.status}`);
  const data = (await res.json()) as { c: number; dp: number };
  return { symbol, price: data.c, changePercent: data.dp, asOf: new Date().toISOString() };
}

// CoinGecko's simple/price endpoint accepts multiple ids in one call —
// used to fetch the whole crypto basket (BTC + ETH) as a single request.
export async function fetchCoinGeckoMulti(ids: string[]): Promise<Record<string, PriceQuote>> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  const data = (await res.json()) as Record<string, { usd: number; usd_24h_change: number }>;
  const asOf = new Date().toISOString();
  return Object.fromEntries(
    ids.map((id) => [id, { symbol: id, price: data[id].usd, changePercent: data[id].usd_24h_change, asOf }])
  );
}

// Cash has no market price — a flat simulated rate stands in for it
// (docs/specs/05-market-data.md's table), no provider call needed.
const CASH_ANNUAL_RATE_PERCENT = 4.5;

export function simulatedCashQuote(): PriceQuote {
  return {
    symbol: "CASH",
    price: 1,
    changePercent: CASH_ANNUAL_RATE_PERCENT / 365,
    asOf: new Date().toISOString(),
  };
}
