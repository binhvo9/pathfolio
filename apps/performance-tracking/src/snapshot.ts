import { snapshots, type SnapshotDoc } from "./db";
import { fetchActivePortfolios, fetchAllPrices, type ActivePortfolio, type PriceQuote } from "./clients";
import { ASSET_CLASSES, type Allocation } from "@pathfolio/shared";

// Core calculation — docs/specs/06-performance-tracking.md's "Per-portfolio
// snapshot" section, steps 1-4.

const STARTING_VALUE = 10_000;

// Real Estate isn't in Market Data (fake/seeded per CLAUDE.md) — same
// flat-rate treatment as Market Data's own Cash handling, so every asset
// class's changePercent means the same thing: "this snapshot's return".
const REAL_ESTATE_ANNUAL_RATE_PERCENT = 6;
const realEstateChangePercent = REAL_ESTATE_ANNUAL_RATE_PERCENT / 365;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Per-class contribution (percentage points) plus their sum — the sum is
// the same weighted change used for the value calculation, but callers
// that only need the breakdown (the UI) or only the total (nothing here
// currently, but keeps the two uses in sync) both come from one place.
//
// `elapsedDays` scales every class's changePercent (a *daily* figure —
// Finnhub's dp, CoinGecko's 24h change, our own Cash/Real Estate annual
// rates ÷ 365) down to however much real time actually passed since the
// last snapshot. Without this, a fast dev-mode interval (30s) left
// running unattended compounds a full day's return every 30 seconds —
// caught for real: $10,000 ballooned to $520,000 in under a day. This
// makes the math correct regardless of interval or downtime, not just
// "safe at whatever interval we happen to pick."
function assetContributions(
  allocation: Allocation,
  prices: Record<string, PriceQuote>,
  elapsedDays: number
): Allocation {
  return Object.fromEntries(
    ASSET_CLASSES.map((cls) => {
      const dailyChangePercent = cls === "realEstate" ? realEstateChangePercent : prices[cls].changePercent;
      return [cls, (allocation[cls] / 100) * dailyChangePercent * elapsedDays];
    })
  ) as Allocation;
}

function sumContributions(contributions: Allocation): number {
  return ASSET_CLASSES.reduce((sum, cls) => sum + contributions[cls], 0);
}

async function getLatestSnapshot(portfolioId: string): Promise<{ value: number; takenAt: Date } | null> {
  const latest = await snapshots.find({ portfolioId }).sort({ takenAt: -1 }).limit(1).toArray();
  return latest.length > 0 ? { value: latest[0].value, takenAt: latest[0].takenAt } : null;
}

const ZERO_CONTRIBUTIONS: Allocation = { stocks: 0, bonds: 0, cash: 0, crypto: 0, gold: 0, realEstate: 0 };

async function snapshotOne(
  portfolio: ActivePortfolio,
  prices: Record<string, PriceQuote>,
  now: Date
): Promise<SnapshotDoc> {
  const previous = await getLatestSnapshot(portfolio.id);
  const elapsedDays = previous ? (now.getTime() - previous.takenAt.getTime()) / MS_PER_DAY : 0;
  const contributions = previous ? assetContributions(portfolio.allocation, prices, elapsedDays) : ZERO_CONTRIBUTIONS;

  const value = previous ? previous.value * (1 + sumContributions(contributions) / 100) : STARTING_VALUE;
  const valueChangePercent = previous ? ((value - previous.value) / previous.value) * 100 : 0;

  const doc: SnapshotDoc = {
    portfolioId: portfolio.id,
    userId: portfolio.userId,
    value,
    valueChangePercent,
    assetContributions: contributions,
    allocationSnapshot: portfolio.allocation,
    takenAt: now,
  };
  await snapshots.insertOne(doc);
  return doc;
}

export async function runSnapshotCycle(): Promise<{ portfoliosSnapshotted: number }> {
  const [portfolios, prices] = await Promise.all([fetchActivePortfolios(), fetchAllPrices()]);
  const now = new Date();
  await Promise.all(portfolios.map((p) => snapshotOne(p, prices, now)));
  return { portfoliosSnapshotted: portfolios.length };
}
