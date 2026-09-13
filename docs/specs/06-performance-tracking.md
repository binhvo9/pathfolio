# Feature: Performance Tracking Service

Status: Implemented (updated 2026-09-03 — added per-class contribution
breakdown + a concurrency guard on the worker; see Behavior/Data)
Service: Performance Tracking

## Problem / goal

Comparing scenarios (core value prop #4/#5) needs a history of how each
portfolio's value actually moved, not just its allocation. This service
is the tumbling-window job that builds that history.

## Scope

In: a scheduled job that snapshots every **Active** portfolio's simulated
value, using Market Data's prices; storing the resulting time series.

Out: AI comparison of the history (Phase 5's job — this service only
produces the raw data points). Real intraday tracking — snapshots are
discrete points at a configured interval, not continuous.

## Behavior

**Cadence:** runs on `SNAPSHOT_INTERVAL` (env var, per CLAUDE.md's
2026-08-29 entry — seconds/minutes in dev with mocked prices,
daily/weekly in production with real Market Data calls).

**Cross-service dependency:** needs every user's Active portfolios, not
one user's — Simulation's existing `GET /portfolios` is scoped to a
single `x-user-id`. Adds one new internal-only endpoint to Simulation:
`GET /internal/active-portfolios` (no user scoping, still gated by
`x-internal-api-key`) that this service calls each run.

**Per-portfolio snapshot:**
1. Fetch current prices for all 5 live classes from Market Data (cached,
   so this doesn't hammer Finnhub/CoinGecko every run)
2. Real Estate isn't in Market Data (fake/seeded per CLAUDE.md) — this
   service applies a flat simulated annual appreciation rate instead,
   same treatment as Market Data's Cash handling
3. First snapshot for a portfolio: value = a fixed $10,000 notional
   starting point (simple, beginner-friendly number, not real money
   regardless)
4. Every snapshot after the first: `value = previousValue * (1 + weightedChangePercent / 100)`,
   where `weightedChangePercent` is each asset class's `changePercent`
   (from Market Data / the flat rates) weighted by the portfolio's
   allocation % **and scaled by `elapsedDays`** (real time since the
   previous snapshot ÷ 1 day) — every `changePercent` is a *daily* figure,
   so without this scaling a short interval left running compounds a
   full day's return every tick (caught for real 2026-09-12: $10,000 →
   $520,000 in ~30 hours at a 30s interval). Also stored per-class (not
   just the sum) as `assetContributions` — FR-PERF-4, so the UI can show
   *which* classes drove the change, not just the total. Computed once at
   snapshot time, never recalculated later, so older snapshots stay
   historically accurate even as today's prices move.

**Concurrency:** the worker won't start a new cycle while a previous one
is still running (NFR-S-3) — a slow provider call on one tick can't
overlap the next and produce two snapshots for what should be one window.

**Known simplification, now handled:** each provider's `changePercent` is
*their* period (~24h — Finnhub's day-over-day, CoinGecko's 24h change),
not the exact time since this portfolio's last snapshot. Originally left
as an accepted demo-scale approximation; upgraded to a real fix
(`elapsedDays` scaling, above) on 2026-09-12 after it produced a genuine
runaway-compounding bug in practice, not just a theoretical gap. Still an
approximation (a real historical price *series* would be more accurate
than scaling a single daily figure), but no longer one that can blow up.

## Data

`PerformanceSnapshots` collection (MongoDB Atlas, same cluster as
Portfolios per CLAUDE.md's storage split):
- `id`, `portfolioId`, `userId`
- `value`, `valueChangePercent` (this period's change)
- `assetContributions` (each of the 6 classes' percentage-point
  contribution to `valueChangePercent` — they sum to it)
- `allocationSnapshot` (the allocation used for this calculation — an
  audit trail, in case allocation editing is ever added later)
- `takenAt`

Holdings-level detail (which stocks/crypto make up a class) is **not**
stored here — it's a live read from Market Data at view time
(`05-market-data.md`'s API section), since basket weights are fixed and
only prices move.

## API / interface

- No user-facing endpoints of its own beyond what the UI needs:
  `GET /portfolios/:id/snapshots` — history for one portfolio (used by
  the performance history view)
- Calls Simulation's new `GET /internal/active-portfolios`
- Calls Market Data's `GET /prices`
- Runs as a scheduled job, not triggered by a user request

## Open questions

None open — exact snapshot interval and the Real Estate flat rate are
tunable constants, not architectural decisions.
