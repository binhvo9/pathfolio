# PathFolio — Project Memory & Progress Log

## What this is
Robo-advisor portfolio project for New Zealand retail investors (beginner-level,
middle/lower income). Built to demonstrate system design + software architecture
skills for a Business Analyst / Data Analyst portfolio aimed at NZ recruiters.

Not a real financial product — no real money, no real trades. Simulated scenarios only.

This project now serves **two separate portfolio outputs**: the
engineering/system-design case study aimed at recruiters (Phase 7 of
BACKLOG.md), and a **UX/UI design case study for Behance**, built in
Figma (user has a Pro account), styled after case studies like
[Donor Hub — Blood Donation App](https://www.behance.net/gallery/253760559/Donor-Hub-Blood-Donation-Mobile-App-UX-Case-Study)
— simpler scope is fine, same idea: research → flows → mockups → final
screens, written up as a process story. See BACKLOG.md Phase 8.

## Core value proposition
Let a complete beginner:
1. Answer an onboarding interview (goals, risk tolerance, time horizon)
2. Get a suggested default portfolio allocation
3. Create multiple *scenario* portfolios to compare against each other
4. See periodic (tumbling window) performance snapshots per scenario
5. Get an AI-generated comparison: which portfolio is winning, and why,
   relative to the stated financial goal

## Architecture decision
- **Microservices**, EXCEPT the User & Onboarding domain, which is a
  deliberate **modular monolith** (auth + profile + risk questionnaire
  live together because they're always used together — avoids pointless
  network hops for tightly coupled logic).
- Services communicate via a **message broker / event bus** (event-driven),
  not direct request-response, except where the user needs an immediate reply
  (e.g. viewing their own dashboard).

## Services
| Service | Type | Key concept demonstrated |
|---|---|---|
| User & Onboarding | Modular monolith | Multi-tier, ACID |
| Portfolio Simulation | Microservice | CAP theorem (chooses AP) |
| Market Data | Microservice | Caching, rate limiting |
| Performance Tracking | Microservice | Tumbling window stream processing |
| Insight/AI Generation | Microservice | Event-driven trigger, LLM integration, object storage (PDF report export to R2) |

## Storage
- Relational (Postgres): Users, RiskProfile — needs ACID, source of truth
- NoSQL (Mongo-style): Portfolios, PerformanceSnapshots, Insights — flexible schema
- Cache (Redis): MarketData — not stored permanently

## Tech stack (decided 2026-08-29)
- Backend: **Node/TypeScript (Next.js)** — full-stack in one place
- Database: **Neon Postgres** — managed, generous free tier
- Auth: **NextAuth.js (Auth.js)** with OAuth providers (Google/GitHub),
  backed by the Neon Postgres DB — Neon has no built-in auth like Supabase
  did, so this is a separate library instead of a platform feature
- Secondary store: **MongoDB Atlas** (free tier) — Portfolios,
  PerformanceSnapshots, Insights live here as separate collections in one
  cluster, keeping the deliberate relational-vs-flexible-schema split
- Broker / cache / rate limiting: **Upstash Redis** — serverless REST API,
  fits Vercel deploys; used for event bus (Redis Streams), Market Data
  caching, and rate limiting the external price API
- Object storage: **Cloudflare R2** — stores generated PDF scenario reports
  (see "Report export" under Insight/AI in the Services table)
- API Gateway: a lightweight gateway/reverse-proxy in front of the
  microservices, planned for Phase 6 — deliberately demonstrated because
  this project has real separate services, unlike a monolith reference like
  DevStash
- Compute hosting (decided 2026-09-13, see that day's progress log entry):
  **apps/web on Vercel**, the **4 Fastify microservices + the
  performance-tracking worker on Railway** — not all-Vercel. Railway
  hosts long-running processes unmodified; Vercel serverless can't keep a
  `setInterval` worker or a persistent `app.listen()` alive between
  requests.

### Snapshot interval strategy (Performance Tracking)
- Interval is an env var (`SNAPSHOT_INTERVAL`), not hardcoded.
- Dev/test: set to seconds/minutes, and use **mocked/cached price fixtures**
  — never hit the real Market Data API on a fast loop, to avoid burning
  free-tier quota.
- After the showcase recording is done: keep the cron running but stretch
  the interval out (e.g. weekly) rather than killing it — keeps the live
  demo link genuinely alive for recruiters instead of going stale.

## How to use this file
This file is the single source of truth for "what have we decided and why."
Update it whenever a decision is made. Don't just chat about a decision —
write it here so context survives across sessions.

---

## Progress log (oldest at top, most recent at bottom)

### 2026-08-28 — Project kicked off
- Decided domain: Investment Advisory / Robo-advisor for NZ retail investors,
  beginner persona, standalone (not merged with Voya or JOBGHOST domains)
- Decided architecture: Microservices with one modular monolith (User &
  Onboarding) to demonstrate deliberate architectural trade-off, not just
  "microservices because it's trendy"
- Decided core feature set: onboarding interview, portfolio allocation
  suggestion, multi-scenario simulator, periodic performance tracking
  (tumbling window), AI-generated comparison insight
- Drew initial data model (ERD): Users, RiskProfile, Portfolios,
  PerformanceSnapshots, MarketData (cache only), Insights
- Set up project folder structure (this file, BACKLOG.md, docs/diagrams,
  docs/api, src, tests)

### 2026-08-29 — Tech stack locked, PDF report export feature added
- Tech stack decided: Next.js (Node/TS), Supabase Postgres+Auth, Upstash
  Redis (event bus/cache/rate limit), Cloudflare R2 (report storage)
- Added "export scenario as PDF report" feature to Insight/AI service —
  chosen over avatar upload / CSV import as the R2 use case because it
  plugs directly into the already-planned Insight/AI + Performance
  Tracking flow instead of inventing a new one
- Clarified report logic: it's a snapshot of current state at export time,
  not a fixed template — right after creating a scenario it's just target
  allocation + reasoning; after snapshots accumulate it also includes the
  performance curve and AI comparison insight
- Decided snapshot interval is configurable via env var; test with a short
  interval + mocked price data, run real interval in production; after
  recording the portfolio showcase, keep the cron alive at a stretched-out
  interval instead of turning it off, so the live demo stays genuinely live
- Added API Gateway as a planned Phase 6 item, to demonstrate a pattern
  that only makes sense with real separate microservices

### 2026-08-29 — DB swapped to Neon, load balancer noted as POC
- Swapped Postgres provider from Supabase to **Neon** (generous free tier).
  Since Neon has no built-in auth, added **NextAuth.js (Auth.js)** as a
  separate library for OAuth login, backed by the Neon DB
- Confirmed **MongoDB Atlas** (free tier) as the actual NoSQL provider for
  Portfolios/PerformanceSnapshots/Insights — 1 cluster, 3 collections
- Load Balancer: not custom-built (services are serverless on Vercel,
  which load-balances automatically); noted in diagrams as "handled by
  hosting platform" in front of Market Data, the most-called service —
  POC-level, not hand-rolled infra

### 2026-08-29 — Risk questionnaire gets a second axis, asset classes expanded
- Risk questionnaire produces TWO scores, not one: **risk score**
  (volatility tolerance → Conservative/Balanced/Growth/Aggressive) and
  **income tilt** (need for regular cashflow/dividends now vs. pure
  growth, untouched for years) — same person can be high-risk-tolerance
  but also high-income-need (e.g. retiree who still wants growth exposure
  but needs to eat)
- Income tilt only shifts the ratio between the existing asset buckets for
  MVP — no new "dividend equity" bucket, keeps the allocation engine simple
- Asset classes expanded from 3 to 6: Stocks, Bonds, Cash, Crypto (BTC),
  Gold, Real Estate. Crypto and Gold get real prices from Market Data
  (both have easy free price feeds). Real Estate is the odd one out —
  illiquid, no daily price feed — so it uses fake/seeded valuation data
  (sourced from a real historical dataset/report where possible) stored
  separately, POC-level, for demonstration only

### 2026-08-30 — Repo scaffolded, Phase 1 AuthModule coded
- Confirmed repo structure: npm workspaces (not pnpm — pnpm needed a
  global symlink write that failed without sudo), `apps/*` for the 5
  services + `packages/shared` — a real monorepo with independently
  deployable services, not one Next.js app with folders per service
  (that would've made "microservices" fake)
- `apps/web` = Next.js 16, and also IS the Onboarding modular monolith's
  backend (API routes) — matches the architecture: Onboarding doesn't
  need its own separate deployable, the monolith-ness is about auth/
  profile/risk-quiz living together, not about a separate server
- Gotchas hit building AuthModule, worth knowing before touching this
  code again:
  - `next-auth` installs v4 (stable tag) by default; need
    `next-auth@beta` (v5) to match `@auth/prisma-adapter` and get proper
    App Router support
  - Prisma 7's generated client has no `index.ts` — import from
    `@/generated/prisma/client`, not the bare folder
  - Prisma 7 requires a driver adapter passed to `new PrismaClient()` —
    plain `DATABASE_URL` alone no longer works. Using
    `@prisma/adapter-neon` since the DB is Neon
  - `prisma init` pinned the CLI to an 8.0.0-rc — pinned back to 7.10.0
    to match `@prisma/client` and dodge vulnerable transitive deps in
    the RC's own dev-tooling
- AuthModule done: schema (User/Account/Session/VerificationToken exactly
  matching the adapter's contract, plus RiskProfile), NextAuth config
  with Google/GitHub, `createUser` event seeds an empty RiskProfile.
  Build/typecheck/lint all pass. **Blocked** on a manual step: create the
  actual Neon project and OAuth app credentials, paste into
  `apps/web/.env`, then run `npx prisma migrate dev` — nobody but the
  user can do the account-creation part of this

### 2026-09-03 — Phases 2-4 built and verified live; Stocks/Crypto get real baskets
- Phases 2 (Portfolio Simulation), 3 (Market Data), 4 (Performance
  Tracking) all coded and confirmed working end-to-end in a real browser
  — not just typechecked. Upstash Redis Streams (event bus), MongoDB
  Atlas (Portfolios/PerformanceSnapshots), Finnhub + CoinGecko (real
  prices) all provisioned and live
- Discovered mid-build: apps/web's proxy routes to each backend service
  (Simulation/Market Data/Performance Tracking) already function as an
  informal **Backend-For-Frontend (BFF)** — the formal API Gateway
  (Phase 6) will just make this pattern explicit, not invent it fresh
- User asked to drill from "Stocks moved +0.5%" down to *which* stocks —
  decided scope together: Stocks becomes a real 5-symbol basket
  (AAPL/MSFT/NVDA/AMZN/GOOGL, fixed weights) and Crypto becomes BTC+ETH;
  Bonds/Gold/Cash/Real Estate stay single-instrument since there's no
  natural "basket" story for them. Market Data's response shape changed
  from one flat quote per class to `{changePercent, holdings[]}` for
  every class uniformly (holdings has 1 entry for the single-instrument
  ones). Performance Tracking now also stores each class's contribution
  to a snapshot's change (`assetContributions`), computed once at
  snapshot time so history stays accurate as today's prices move —
  holdings-level detail itself is a live read, not stored per snapshot,
  since basket weights are fixed and only prices move day to day
- Caught and fixed two real bugs while wiring this up: a CSS specificity
  bug where a generic `.holdingsTable td { color }` rule silently beat
  the `.positive`/`.negative` sign classes (fixed by targeting
  `.holdingsTable td.positive`, which is more specific), and
  Performance Tracking's snapshot worker had no concurrency guard despite
  REQUIREMENTS.md's NFR-S-3 claiming idempotency — added an `isRunning`
  flag so a slow cycle can't overlap the next tick
- All specs (01-06) updated to reflect what's actually built, not just
  what was originally planned — status lines now say "Implemented",
  05/06 got behavior-section rewrites for the basket change

### 2026-09-12 — Phase 5 spec written, LLM swapped to Gemini
- docs/specs/07-insight-ai.md written: Sonnet-equivalent quality tier
  (not the cheapest model) for the comparison text since it's the
  product's headline feature; pdfkit for PDF export; Resend for email;
  an `Insights` Mongo collection logs past comparisons, not just the
  latest one
- Swapped the LLM from Claude/Anthropic to **Google Gemini** — Anthropic's
  API has no real free tier (only expiring trial credits), and this is a
  demo-scale personal project that shouldn't need a paid key just to run.
  Updated the Context/Container diagrams and REQUIREMENTS.md's FR-AI-2 to
  match. Model choice: Gemini Flash, not the smallest/cheapest variant —
  same "quality matters here specifically" reasoning as before
- Noted a real cross-cutting dependency: Onboarding's RiskProfile lives
  inside apps/web (the modular monolith), not a separate service, so
  Insight/AI reaching it means a new internal endpoint on apps/web
  itself — different shape than how it talks to Simulation/Performance
  Tracking (real separate service calls)

### 2026-09-12 — Real runaway-compounding bug, fixed at the root
- User spotted a chart with a portfolio spiking from $10,000 to $520,000.
  Root cause: the snapshot job applied each asset class's `changePercent`
  (a *daily* figure — Finnhub's `dp`, CoinGecko's 24h change, our own
  Cash/Real Estate annual rates ÷ 365) as if it were "this snapshot
  period's return," regardless of how much real time had actually passed.
  At the 30-second dev interval, left running unattended for ~30 hours
  (3621 snapshots), that compounded a full day's return roughly 2880
  times over — the exact failure mode the "known simplification" in
  06-performance-tracking.md warned about, just not at the scale of
  running unattended for over a day
- Fixed at the root rather than just picking a "safer" interval: every
  contribution is now scaled by `elapsedDays` (real time since the
  previous snapshot ÷ 1 day), so the math is correct at ANY interval or
  after ANY downtime — the interval knob is now purely about how often
  you want fresh test data, not a correctness lever
- Reset all snapshot history (3621 bad docs deleted) for a clean demo
  baseline; bumped the dev interval from 30s to 5min (300s) since with
  the fix in place, the only remaining reason to pick a number is
  reducing Mongo write volume during active dev, not avoiding a blowup

### 2026-09-12 — Standing policy: metered APIs must stay well below free tier
- Set while wiring up R2 (PDF export) and Resend (email): this is a
  personal portfolio project, not a funded product — every external
  metered API integration must stay comfortably below its free tier **by
  design**, not by hoping usage stays low
- Concretely: rate-limit every user-triggered call to a metered API
  (Gemini, R2, Resend) in code, the same way Market Data already
  rate-limits its own provider calls (`@upstash/ratelimit`), just scoped
  per-user instead of per-provider; never let a background job call a
  metered API without an interval chosen with cost in mind (see the
  runaway-compounding entry above for what slipping on that looks like)
- Formalized as REQUIREMENTS.md's new "Cost control" NFR section
  (NFR-COST-1/2/3) — applies to every future metered integration, not
  just R2/Resend
- User pushed back on the first cut: per-user limits alone don't protect
  an account-wide quota. Real gap found — Resend's 100 emails/day is
  *per account*, not per user, so the original 5/hour/user cap could
  alone exceed it. Fixed: every metered action now checks a per-user
  limit AND a global limit (`makeLimiterPair` in
  apps/insight-ai/src/ratelimit.ts). Then verified the actual free-tier
  numbers via web search instead of estimating — Resend 100/day
  (account-wide, hard), Gemini Flash 500-1500/day (sources disagree, but
  no billing risk either way — free tier just returns 429), R2 1M Class A
  ops/month. Global caps set at 50/day (Resend), 100/day (Gemini, R2) —
  50%, ≤20%, and 0.3% of the real ceilings respectively. See
  REQUIREMENTS.md's NFR-COST-2 for the full table

### 2026-09-13 — Real create-scenario gap fixed; compute hosting decided (Vercel + Railway, not all-Vercel)
- Caught while starting Phase 6's user journey diagram: core value prop
  #3 ("create multiple scenario portfolios to compare") had no actual
  UI path — the dashboard could only list/activate/archive/delete/
  export/email, never create a second scenario. `POST /portfolios`
  existed on apps/simulation itself but nothing in apps/web called it.
  Fixed: added the proxy route + a "+ New scenario" form on the
  dashboard (name + 6 asset-class % inputs, blocks submit unless the
  total is 100). Verified live in a real browser. The full core loop
  (create → compare → export/email) is now genuinely reachable by a
  real user, not just testable via direct service calls
- Decided compute hosting while writing the deployment diagram (Phase
  6): **not** all-Vercel, despite the 2026-08-29 entry's assumption.
  `apps/web` (Next.js, stateless per-request) fits Vercel serverless
  functions natively. The 4 Fastify microservices don't — they're
  long-running `app.listen()` processes, and
  apps/performance-tracking's snapshot job is a `setInterval` loop
  living inside that same process, which a stateless serverless
  function can't keep alive between requests. **Railway** hosts those 4
  services instead, unmodified — no rewrite needed just to deploy.
  Load Balancer POC-note updated to match: Vercel's routing fronts
  apps/web, Railway's per-service routing + automatic health-check
  restarts front the 4 microservices. See
  `docs/diagrams/deployment.md` for the full diagram
