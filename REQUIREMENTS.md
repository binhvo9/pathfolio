# PathFolio — Functional & Non-Functional Requirements

Reference checklist for building, not a case-study document — see
[CLAUDE.md](CLAUDE.md) for the "why" behind architecture decisions.

---

## Functional Requirements

### User & Onboarding

- FR-ON-1: User can sign up / log in via OAuth (Google/GitHub, through NextAuth.js backed by Neon Postgres)
- FR-ON-2: User completes a risk questionnaire (goals, risk tolerance, time
  horizon, and income need — do they need this portfolio to generate
  regular cashflow, or is it pure long-term growth)
- FR-ON-3: System calculates two scores from questionnaire answers: a risk
  score (volatility tolerance) and an income tilt score (cashflow need)
- FR-ON-4: System suggests a default portfolio allocation across 6 asset
  classes (Stocks, Bonds, Cash, Crypto, Gold, Real Estate) based on risk
  score (which classes/how volatile) and income tilt (ratio shift toward
  stable/cashflow-generating classes)
- FR-ON-5: User can view/edit their profile

### Portfolio Simulation

- FR-SIM-1: User can create a scenario portfolio (custom asset allocation %)
- FR-SIM-2: User can list all their scenario portfolios
- FR-SIM-3: User can delete a scenario portfolio
- FR-SIM-4: Portfolio has a lifecycle state: Draft → Active → Archived
- FR-SIM-5: A new user's first scenario is seeded from Onboarding's default
  allocation event

### Market Data

- FR-MKT-1: System fetches prices for Bonds and Gold (single representative
  ETF each) from Finnhub
- FR-MKT-2: Prices are cached (Upstash Redis) to avoid redundant API calls
- FR-MKT-3: Calls to the external price APIs are rate-limited to respect
  their free-tier quotas
- FR-MKT-4: Real Estate valuations are fake/seeded data (not a live feed) —
  no real daily price exists for illiquid rental property; sourced from a
  real historical dataset where possible, clearly POC-level
- FR-MKT-5: Stocks and Crypto are each a real multi-holding basket (Stocks:
  AAPL/MSFT/NVDA/AMZN/GOOGL; Crypto: BTC/ETH), not a single instrument —
  fixed weights, class-level price = the weighted average of the basket
- FR-MKT-6: Each class's response includes its individual holdings (symbol,
  weight, price, change%), not just the class-level aggregate — powers the
  drill-down in FR-PERF-4

### Performance Tracking

- FR-PERF-1: System takes periodic snapshots of each active portfolio's
  simulated value (tumbling window)
- FR-PERF-2: Snapshot interval is configurable via env var, not hardcoded
- FR-PERF-3: User can view performance history for a portfolio as a chart
  over time, including a hero number (current value + total % change since
  the first snapshot) — the chart supports the number, not the other way
  around
- FR-PERF-4: User can see which asset classes drove a period's change
  (per-class contribution, stored at snapshot time so history stays
  accurate), and drill into Stocks/Crypto specifically to see each
  underlying holding's live weight/price/change (FR-MKT-5/6) — classes
  with only one instrument (Bonds/Gold/Cash/Real Estate) aren't drillable,
  there's nothing under them to show

### Insight/AI

- FR-AI-1: User can trigger a comparison between 2+ of their scenarios
- FR-AI-2: System generates AI insight text (via Google Gemini) explaining which
  scenario is winning relative to the user's stated goal
- FR-AI-3: User can export a scenario as a PDF report — contents reflect
  whatever data exists at export time (allocation only if new; allocation +
  performance curve + insight once snapshots exist)
- FR-AI-4: Exported PDF is stored in Cloudflare R2, served via a signed URL
- FR-AI-5: User can request the PDF report be emailed to them

---

## Non-Functional Requirements

### Maintainability

- NFR-M-1: Each microservice has one clearly-scoped responsibility (matches
  the Services table in CLAUDE.md) — no service grows a second job
- NFR-M-2: Shared types/events live in `src/shared`, never duplicated per service
- NFR-M-3: Every feature gets a spec in `docs/specs/` before it's implemented

### Scalability (by design — not load-tested; this is a demo-scale project)

- NFR-S-1: Services talk through the event bus (Redis Streams), not direct
  synchronous calls, except where the user needs an immediate reply (e.g.
  viewing their own dashboard)
- NFR-S-2: Portfolio Simulation is designed AP per the CAP trade-off
  documented in CLAUDE.md
- NFR-S-3: The Performance Tracking snapshot job never runs two cycles
  concurrently (a slow provider call on one tick can't overlap the next),
  so a single window never produces duplicate snapshots
- NFR-S-4: API p95 response time < 500ms for user-facing reads (dashboard,
  scenario list)
- NFR-S-5: Snapshot job completes within ±2 minutes of its scheduled
  tumbling window

### Security

- NFR-SEC-1: All portfolio/profile data is isolated per user (row-level
  security in Neon Postgres) — user A can never query user B's rows
- NFR-SEC-2: Auth is OAuth-only — no hand-rolled password storage
- NFR-SEC-3: PDF report links are signed URLs that expire after 24h, not
  permanent public links
- NFR-SEC-4: No real financial account linkage — simulated data only,
  explicitly labeled as such in the UI

### Cost control (added 2026-09-12 — this is a personal showcase project, not a funded product)

- NFR-COST-1: Every external metered API (Gemini, Finnhub, CoinGecko, R2,
  Resend) must run comfortably below its free tier at demo-scale usage —
  no feature may loop or retry unbounded against a paid/metered API
- NFR-COST-2: Every user-triggered call to a metered external API (Gemini
  compare, PDF export, email send) is rate-limited **in code**, not just
  assumed to stay low — the same `@upstash/ratelimit` pattern Market Data
  uses for its own provider calls, but as **two layers**: a per-user limit
  AND an account-wide global limit, since a per-user cap alone doesn't
  protect a shared account quota (Resend's 100 emails/day is per
  *account*, not per user). Real, verified free-tier numbers (not
  estimates) and PathFolio's global caps against them:

  | Service | Real free tier | Global cap set | Margin |
  |---|---|---|---|
  | Resend | 100 emails/day (account-wide, hard) | 50/day | 50% — the tightest real cap of the three |
  | Gemini Flash | 500-1500 requests/day (sources disagree; no billing risk — free tier just 429s) | 100/day | ≤20% of the lowest reported figure |
  | Cloudflare R2 | 1,000,000 Class A ops/month, 10GB storage | ~3,000/month (100/day) | 0.3% |
- NFR-COST-3: Any scheduled/background job that calls a metered API
  (the Performance Tracking snapshot worker) has its interval chosen with
  cost in mind, not just data freshness — and must never be able to
  self-amplify (see the 2026-09-12 runaway-compounding bug in CLAUDE.md
  for what happens when this isn't true)
