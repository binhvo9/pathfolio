import { redis, providerRatelimit } from "./redis";
import { fetchFinnhubQuote, fetchCoinGeckoMulti, simulatedCashQuote, type PriceQuote } from "./providers";

export const ASSET_CLASSES = ["stocks", "bonds", "gold", "crypto", "cash"] as const;
export type LiveAssetClass = (typeof ASSET_CLASSES)[number];

const CACHE_TTL_SECONDS = 300;

export type Holding = { symbol: string; weight: number; price: number; changePercent: number };
export type ClassQuote = { changePercent: number; asOf: string; holdings: Holding[] };

// Fixed weights within each class — per the 2026-09-03 drill-down decision
// in CLAUDE.md: Stocks and Crypto get a real multi-symbol basket, the
// other classes stay single-instrument (weight 1). Real Estate isn't
// here at all — it's fake/seeded, not a Market Data class.
const STOCK_WEIGHTS: Record<string, number> = { AAPL: 0.25, MSFT: 0.25, NVDA: 0.2, AMZN: 0.15, GOOGL: 0.15 };
const CRYPTO_WEIGHTS: Record<string, number> = { bitcoin: 0.7, ethereum: 0.3 };
const CRYPTO_SYMBOL: Record<string, string> = { bitcoin: "BTC", ethereum: "ETH" };

function weightedAverage(holdings: Holding[]): number {
  return holdings.reduce((sum, h) => sum + h.weight * h.changePercent, 0);
}

async function fetchStocksBasket(): Promise<ClassQuote> {
  const quotes = await Promise.all(Object.keys(STOCK_WEIGHTS).map((symbol) => fetchFinnhubQuote(symbol)));
  const holdings = quotes.map((q) => ({ ...q, weight: STOCK_WEIGHTS[q.symbol] }));
  return { changePercent: weightedAverage(holdings), asOf: new Date().toISOString(), holdings };
}

async function fetchCryptoBasket(): Promise<ClassQuote> {
  const quotes = await fetchCoinGeckoMulti(Object.keys(CRYPTO_WEIGHTS));
  const holdings = Object.entries(quotes).map(([id, q]) => ({
    symbol: CRYPTO_SYMBOL[id],
    weight: CRYPTO_WEIGHTS[id],
    price: q.price,
    changePercent: q.changePercent,
  }));
  return { changePercent: weightedAverage(holdings), asOf: new Date().toISOString(), holdings };
}

async function fetchSingleInstrument(quote: PriceQuote): Promise<ClassQuote> {
  return { changePercent: quote.changePercent, asOf: quote.asOf, holdings: [{ ...quote, weight: 1 }] };
}

async function fetchFromProvider(assetClass: LiveAssetClass): Promise<ClassQuote> {
  switch (assetClass) {
    case "stocks":
      return fetchStocksBasket();
    case "bonds":
      return fetchSingleInstrument(await fetchFinnhubQuote("BND"));
    case "gold":
      return fetchSingleInstrument(await fetchFinnhubQuote("GLD"));
    case "crypto":
      return fetchCryptoBasket();
    case "cash":
      return fetchSingleInstrument(simulatedCashQuote());
  }
}

function cacheKey(assetClass: LiveAssetClass) {
  return `market-data:price:${assetClass}`;
}

export async function getPrice(assetClass: LiveAssetClass): Promise<ClassQuote> {
  const cached = await redis.get<ClassQuote>(cacheKey(assetClass));
  if (cached) return cached;

  // Cash never calls an external provider, so it never needs rate limiting.
  if (assetClass !== "cash") {
    const { success } = await providerRatelimit.limit(assetClass);
    if (!success) throw new Error(`Rate limited fetching ${assetClass}, and no cached price available`);
  }

  const quote = await fetchFromProvider(assetClass);
  await redis.set(cacheKey(assetClass), quote, { ex: CACHE_TTL_SECONDS });
  return quote;
}

export async function getAllPrices(): Promise<Record<LiveAssetClass, ClassQuote>> {
  const entries = await Promise.all(ASSET_CLASSES.map(async (cls) => [cls, await getPrice(cls)] as const));
  return Object.fromEntries(entries) as Record<LiveAssetClass, ClassQuote>;
}
