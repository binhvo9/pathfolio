# Feature: Market Data Service

Status: Implemented (updated 2026-09-03 — Stocks/Crypto became real
multi-holding baskets, not a single instrument; see Behavior)
Service: Market Data

## Problem / goal

Performance Tracking (Phase 4) needs a current price for each asset class
to compute how a portfolio's value has changed. This service is the only
one allowed to call external price APIs — everyone else reads from its
cache.

## Scope

In: fetching + caching a representative price for Stocks, Bonds, Crypto,
Gold; a flat simulated rate for Cash; rate limiting outbound calls to the
external providers.

Out: Real Estate (fake/seeded data per CLAUDE.md's 2026-08-29 entry, not
a live feed — lives in its own store, not this service). Historical price
storage (this service only ever returns the *current* price; Performance
Tracking is the one that persists a time series of snapshots).

## Behavior

**Asset class → instrument(s)** — Bonds/Gold/Cash stay single-instrument
(one price call covers the class); Stocks and Crypto are real
multi-holding baskets with fixed weights, added 2026-09-03 after the user
asked to drill into what's actually driving a class's change:

| Asset class | Instrument(s) | Weights | Provider |
|---|---|---|---|
| Stocks | AAPL, MSFT, NVDA, AMZN, GOOGL | 25/25/20/15/15% | Finnhub (5 calls, 1 per symbol) |
| Bonds | BND (Total Bond Market ETF) | 100% | Finnhub |
| Gold | GLD (Gold ETF) | 100% | Finnhub |
| Crypto | BTC, ETH | 70/30% | CoinGecko (1 call, multi-id) |
| Cash | — (flat simulated rate, no API call) | — | none |

A class's `changePercent` is always the weight-averaged sum across its
holdings — for single-instrument classes that's just the one instrument's
own change, so the math is uniform whether a class has 1 holding or 5.

**Fetch + cache:** on a price request, check Redis (Upstash) first. On a
cache miss, call the instrument's provider, store the result with a TTL
(5 minutes), return it. This satisfies FR-MKT-2 and is what keeps this
service inside both providers' free-tier limits at demo scale.

**Rate limiting:** outbound calls to Finnhub/CoinGecko are rate-limited
(`@upstash/ratelimit`, same Redis instance) independent of the cache —
belt-and-suspenders per FR-MKT-3, since a cache TTL alone doesn't cap a
sudden burst of concurrent cache-miss requests.

## Data

No persistent store of its own — Redis is a cache, not a database (the 6
months of decisions in CLAUDE.md's Storage section already call this out:
"Cache (Redis): MarketData — not stored permanently").

## API / interface

- `GET /prices` — returns `{ changePercent, asOf, holdings: [...] }` for
  each of the 5 live-tracked classes (`stocks`, `bonds`, `gold`, `crypto`,
  `cash`). `holdings` has 1 entry for single-instrument classes, 5 or 2
  for the baskets — always present, so callers don't need a special case;
  a class is only "drillable" in the UI sense when `holdings.length > 1`.
  Gated by `x-internal-api-key` only, no `x-user-id` — prices aren't user
  data, so there's nothing to scope; the key alone keeps this off the
  public internet.
- `GET /prices/:assetClass` — single class, same shape

Consumed by apps/web's `/api/market-data/prices` proxy for the holdings
drill-down on the portfolio performance page (FR-MKT-6, FR-PERF-4) — a
live "right now" read, not tied to a specific historical snapshot, since
the baskets' weights are fixed and only prices move day to day.

## Open questions

None open — exact TTL (5 min) and rate limit numbers are tunable
constants, not architectural decisions.
