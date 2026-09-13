# PathFolio — System Design Case Study

**A robo-advisor portfolio simulator for beginner NZ retail investors, built to demonstrate deliberate architecture trade-offs, not to demonstrate a trend.**

Solo project. Not a real financial product — no real money, no real trades, simulated scenarios only. Full decision log: [`CLAUDE.md`](../CLAUDE.md). Requirements: [`REQUIREMENTS.md`](../REQUIREMENTS.md). Build log with the war stories: [`FEATURES.md`](../FEATURES.md).

---

## Problem

Two problems, one project.

**The product problem.** A beginner, middle/lower-income NZ investor who wants to start investing usually hits one of two walls: generic advice ("just buy an index fund") that ignores their actual goal and time horizon, or a real advisory product that assumes they already understand risk tolerance, asset classes, and rebalancing. PathFolio's core loop is deliberately narrow: answer an onboarding interview, get a suggested allocation across six asset classes, create multiple *scenario* portfolios to compare against each other, watch periodic performance snapshots, and get a plain-English AI explanation of which scenario is winning relative to the stated goal. No live trading, no real account linkage — the value is in the decision-support loop, not the execution.

**The demonstration problem.** This project exists to show a Business Analyst / Data Analyst hiring audience how I reason about system design, not just that I can write code that runs. That meant deliberately building something with more than one architectural shape in it — a place where "microservices" and "modular monolith" and "AP over CP" are real trade-offs I can defend, not vocabulary. The rest of this document is the "why," pulled directly from the project's own decision log rather than reconstructed after the fact.

---

## Design decisions

### One deliberate modular monolith, four real microservices

User & Onboarding (auth, profile, risk questionnaire) is a modular monolith living inside `apps/web` — not because it was easier, but because those three concerns are always used together and a network hop between them would have been pure overhead with no corresponding benefit. Portfolio Simulation, Market Data, Performance Tracking, and Insight/AI are genuinely separate deployable services (`apps/simulation`, `apps/market-data`, `apps/performance-tracking`, `apps/insight-ai`), each with one clearly scoped job (`REQUIREMENTS.md` NFR-M-1). The point of the split isn't "microservices are better" — it's that the same system contains both shapes side by side, chosen for different reasons, which is closer to what real organizations actually look like than an all-or-nothing pick.

One consequence of the monolith choice showed up later and is worth naming: because RiskProfile lives inside `apps/web` rather than a separate service, Insight/AI reaching it required a bespoke internal endpoint (`/api/internal/risk-profile`) with hand-rolled auth, rather than the same trusted-caller pattern used for the other three service-to-service calls. That's the real cost of the monolith decision surfacing downstream, not a hidden one.

### Portfolio Simulation chooses AP (CAP theorem)

Portfolio Simulation is explicitly designed AP (`REQUIREMENTS.md` NFR-S-2) — availability and partition tolerance over strict consistency. A scenario portfolio is a user's own simulated data with no shared-state contention (nobody else is reading or writing it concurrently), so there's no real cost to eventual consistency, and every write path benefits from never blocking on a consistency check that doesn't protect anything real here. This is presented in the C4 diagrams and specs as a stated trade-off, not an implementation accident.

### Event-driven by default, synchronous only where a user is waiting

Services talk through an event bus (Upstash Redis Streams) rather than direct request-response, except where a user needs an immediate reply — viewing their own dashboard, triggering a comparison (`REQUIREMENTS.md` NFR-S-1). Onboarding's completion publishes a `UserOnboarded` event that seeds a user's first scenario in Simulation asynchronously; the user doesn't wait on that pipeline, they just see it appear. Mid-build, this surfaced an unplanned but genuine pattern: `apps/web`'s proxy routes to each backend service were already functioning as an informal Backend-For-Frontend before the formal API Gateway existed — the Gateway (Phase 6) made that pattern explicit rather than inventing it (`FEATURES.md` #33, decision log 2026-09-03).

### API Gateway — earned, not decorative

The Gateway (`apps/api-gateway`, `docs/specs/08-api-gateway.md`) is a real Fastify + `@fastify/http-proxy` reverse proxy in front of the four microservices, routing by path prefix. It's deliberately a pure router with no auth logic of its own — each downstream service still enforces its own `x-internal-api-key`/`x-user-id` trusted-caller headers exactly as before, matching how a real gateway sits in front of services that already defend themselves. It's scoped to edge traffic only: Insight/AI's own direct calls into Simulation and Performance Tracking bypass the gateway, the same way a real service mesh treats internal versus external traffic differently. Building it caught a real, current CVE — the pinned `@fastify/http-proxy` version had a critical advisory (GHSA-gwhp-pf74-vj37, connection-header abuse stripping proxy-added headers) — resolved by bumping to a patched version before shipping, not after.

### Two-platform hosting split, forced by a real architectural mismatch

The original hosting assumption (decision log, 2026-08-29) was "everything serverless on Vercel." Drawing the deployment diagram (Phase 6) forced a check of that assumption against what was actually built, and it didn't hold: the four Fastify microservices are long-running `app.listen()` processes, and Performance Tracking's snapshot job is a `setInterval` loop living inside that same process — neither fits a stateless serverless function without a rewrite. The fix wasn't to paper over it: `apps/web` stays on Vercel (its request/response shape is genuinely serverless-friendly), while the four microservices plus the snapshot worker moved to Railway, which hosts long-running processes unmodified. This is documented as a correction to an earlier stated assumption in both `CLAUDE.md` and `docs/diagrams/deployment.md`, not a silent edit.

### Cost guardrails as a first-class NFR, not an afterthought

Every metered external API (Gemini, Finnhub, CoinGecko, R2, Resend) has to run comfortably below its free tier by design (`REQUIREMENTS.md` NFR-COST-1/2/3). Concretely: every user-triggered call to a metered API is rate-limited in code with **two layers** — a per-user limit and an account-wide global limit — because a per-user cap alone doesn't protect a shared account quota. This was caught as a real gap partway through: the first cut only had per-user limits, and Resend's 100-emails/day cap is per *account*, not per user, so a per-user cap alone could still blow through it. The fix (`makeLimiterPair` in `apps/insight-ai/src/ratelimit.ts`) was verified against real, sourced free-tier numbers rather than estimates — global caps were set at 50% of Resend's real ceiling, ≤20% of Gemini's, and 0.3% of R2's (full table in `REQUIREMENTS.md` NFR-COST-2).

---

## Trade-offs

Things left out on purpose, and why:

- **No in-place scenario editing.** A scenario's allocation is fixed once created; changing your mind means creating a new scenario and comparing. This is a deliberate scope cut documented in `docs/specs/04-portfolio-simulation.md` and called out explicitly in the user journey diagram (`docs/diagrams/journey/first-time-user.md`) — editing would add meaningful state-management complexity for a demo-scale product where "just make another scenario" is arguably the more honest UX anyway, since portfolios are meant to be compared, not iterated on in place.
- **Real Estate uses seeded, not live, data.** There's no daily price feed for illiquid rental property, so Real Estate valuation is fake/seeded data sourced from a real historical dataset where possible, and clearly labeled as POC-level (`REQUIREMENTS.md` FR-MKT-4). Stocks and Crypto, by contrast, are real multi-holding baskets (5-stock, BTC+ETH) priced live via Finnhub and CoinGecko — the live-data investment went where it demonstrates something (basket weighting, drill-down), not into faking a feed that doesn't exist.
- **A real, caught product gap: no way to create a second scenario existed until Phase 6.** While drawing the user journey diagram, it became clear that core value proposition #3 ("create multiple scenario portfolios to compare") had no actual UI path — the dashboard only ever listed, activated, archived, deleted, exported, or emailed a scenario; every "second scenario" up to that point had been created by a direct API call during testing (`FEATURES.md` #74). This is included here deliberately rather than smoothed over: it's a real example of catching my own gap by testing the system against its own stated user journey, not by code review. It was fixed the same session — validated create-scenario form, wired end to end, verified live in a browser.
- **A real runaway-compounding bug, fixed at the root rather than papered over.** A user-visible chart once spiked a $10,000 simulated portfolio to $520,000. Root cause: the snapshot worker applied each asset class's *daily* change percentage as if it were that snapshot period's own return, regardless of real elapsed time — left running unattended at a 30-second dev interval for ~30 hours, that compounded a single day's return roughly 2,880 times. The fix scales every contribution by real elapsed time ÷ one day, so the math is correct at any interval or after any downtime — the snapshot interval is now purely a data-freshness knob, not a correctness lever (decision log, 2026-09-12; `docs/specs/06-performance-tracking.md`). All 3,621 bad snapshots were deleted for a clean baseline rather than left in the demo data.
- **YAGNI calls:** no custom-built load balancer (Vercel and Railway's platform-level routing/health-check restarts cover this at POC scale — documented as such in `docs/diagrams/deployment.md` rather than silently assumed); no hand-rolled password auth (OAuth-only via NextAuth, `REQUIREMENTS.md` NFR-SEC-2); no SDK dependency for Market Data or Insight/AI's Gemini calls (plain `fetch`, matching the project's general preference for the lightest tool that does the job — R2 is the one deliberate exception, since presigned URLs need SigV4 signing that's impractical to hand-roll).

---

## Outcome

As of the last documented pass (`BACKLOG.md`), Phases 0 through 6 are complete and verified live — not just typechecked:

- **Phase 1 (Onboarding):** real OAuth login (Google/GitHub via NextAuth backed by Neon Postgres), risk questionnaire producing two independent scores (risk tolerance + income tilt), rule-based allocation engine across six asset classes, verified end-to-end in a browser.
- **Phase 2 (Portfolio Simulation):** create/list/activate/archive/delete scenarios, Draft → Active → Archived lifecycle, seeded automatically from onboarding via the event bus, verified live.
- **Phase 3 (Market Data):** real prices for Bonds/Gold (Finnhub) and a 5-stock/2-coin basket for Stocks/Crypto (Finnhub + CoinGecko), cache-first via Upstash Redis with a separate rate-limiting layer, verified against real provider responses.
- **Phase 4 (Performance Tracking):** a tumbling-window snapshot worker with a configurable interval, per-asset-class contribution breakdown, and holdings-level drill-down for the basket classes — including the concurrency guard (`isRunning` flag) that makes the "no overlapping snapshot cycles" NFR actually true rather than just asserted.
- **Phase 5 (Insight/AI):** AI-generated scenario comparisons via Gemini, grounded in real allocation + snapshot + risk-profile data pulled from three separate sources; PDF export to Cloudflare R2 with a 24-hour signed URL; email delivery via Resend — all verified against real generated artifacts (a real PDF opened, a real email received), not mocked responses.
- **Phase 6 (API contract & docs):** OpenAPI 3.1 specs for Onboarding and Simulation (lint-clean), a full deployment diagram reflecting the real Vercel/Railway split, and the API Gateway routing all edge traffic through one entry point — verified live end to end through the gateway in a real browser session.

**Not done, and not claimed as done:** Phase 7 (public demo deployment, README with embedded diagrams, cleaned commit history, walkthrough video) and Phase 8 (a separate Figma/Behance UX case study) are both open per `BACKLOG.md`. This document is itself one of Phase 7's deliverables.

**What that adds up to today:** the full core loop — onboard, get a suggested allocation, create a second scenario, compare two scenarios with a real AI-generated explanation, export and email a PDF report — is reachable by a real user clicking through a real browser, running across six independently deployable processes talking through an event bus and a gateway, with two intentionally different architectural shapes (modular monolith, microservices) living in the same system for a documented reason. The diagrams a reviewer would want to check this against: [C4 context](diagrams/c4/context.md), [C4 container](diagrams/c4/container.md), [C4 component — Onboarding](diagrams/c4/component-onboarding.md), [deployment](diagrams/deployment.md), [portfolio lifecycle state diagram](diagrams/state/portfolio-lifecycle.md), [onboarding sequence](diagrams/sequence/onboarding.md), [performance snapshot sequence](diagrams/sequence/performance-snapshot.md), [scenario compare sequence](diagrams/sequence/scenario-compare.md), and the [first-time user journey](diagrams/journey/first-time-user.md).
