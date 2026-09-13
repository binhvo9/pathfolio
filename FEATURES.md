# PathFolio — Feature Status

Purpose: quick-glance "what are we doing right now" file. For full decision
rationale see [CLAUDE.md](CLAUDE.md); for the full task list see
[BACKLOG.md](BACKLOG.md).

How to read this file: completed items are logged at the bottom, oldest
first. Newest completed work is always the last entry. When you finish
something, add a line at the bottom instead of editing history above it.

---

## Now working on

- Two-layer (per-user + global) rate limiting done and verified against
  real, sourced free-tier numbers — see docs/dev-setup.md for the full
  handoff (how to run all 5 services, known gotchas, exact next steps).
  Next: PDF export (FR-AI-3/4) using the already-built `exportLimiter`,
  then email (FR-AI-5) using `emailLimiter`.

## Not started

- User & Onboarding modular monolith: schema + CRUD
- Onboarding interview logic → risk score calculation
- Default allocation suggestion engine
- Portfolio Simulation service: create/list/delete scenarios
- Market Data service: fetch + cache prices
- Event bus wiring: Onboarding → downstream services
- Performance Tracking service: tumbling window job
- Insight/AI service: prompt design + integration
- Frontend: onboarding UI, dashboard, comparison view, performance history
- Remaining diagrams: C4 Context/Container/Component, sequence x3, state
- OpenAPI spec (Onboarding + Simulation)
- Deployment diagram, case study, public demo, cleaned-up repo, walkthrough
- Phase 8: UX/UI Behance case study (Figma) — separate track, can start
  anytime once a flow is scoped

---

## Completed (oldest → newest)

1. Project scoped: NZ retail-investor robo-advisor portfolio piece, decided
   standalone (not merged with other domains).
2. Architecture decided: microservices + one deliberate modular monolith
   (User & Onboarding), event-driven except direct-reply reads.
3. Core feature set decided: onboarding interview, allocation suggestion,
   multi-scenario simulator, tumbling-window performance tracking,
   AI-generated comparison insight.
4. ERD drawn: Users, RiskProfile, Portfolios, PerformanceSnapshots,
   MarketData (cache only), Insights.
5. Project folder structure set up: CLAUDE.md, BACKLOG.md, docs/diagrams,
   docs/api, src/ (5 service folders + shared), tests/.
6. Per-service README stubs added under src/services/* describing each
   service's responsibility (no code yet).
7. Tech stack locked: Next.js (Node/TS), Supabase Postgres+Auth, Upstash
   Redis (event bus/cache/rate limit), Cloudflare R2 (PDF report storage).
8. Added "export scenario as PDF report" feature (Insight/AI service) and
   "API Gateway" task (Phase 6) to BACKLOG.md.
9. C4 Context diagram drawn (published as artifact): actor + 4 external
   systems (Market Data, Claude, OAuth, Email).
10. LLM provider locked to Claude (Anthropic); added "email the PDF report"
    as a feature alongside the R2 export.
11. REQUIREMENTS.md written: FR per service (FR-ON/SIM/MKT/PERF/AI), NFR
    for the 3 chosen quality attributes (Maintainability, Scalability,
    Security) with concrete targets (p95 < 500ms, ±2min snapshot window,
    24h signed URL expiry, row-level data isolation).
12. C4 Container diagram drawn (ASCII, shown in chat — no more Artifact
    links for diagrams per user preference, saved to memory).
13. Architecture terms walked through one at a time, applied to PathFolio:
    async/sync, cron job, cluster/collection, API Gateway, Load Balancer
    (POC-level, platform-handled), layered architecture, Lambda/serverless,
    event-driven/event bus/message broker/Kafka, CDN/cache/rate limit.
14. Postgres provider swapped Supabase → Neon; added NextAuth.js (Auth.js)
    for OAuth since Neon has no built-in auth. Confirmed MongoDB Atlas as
    the actual NoSQL provider (1 cluster, 3 collections).
15. docs/specs/01-auth-user-schema.md written: Users + RiskProfile as
    separate tables (matches ERD), OAuth-only via NextAuth, empty
    RiskProfile created at signup.
16. Asset classes expanded 3 → 6 (added Crypto, Gold, Real Estate —
    Real Estate uses fake/seeded data, not a live feed).
17. docs/specs/02-risk-questionnaire.md written: two independent additive
    scores (risk score + income tilt), both rule-based band lookups,
    stored on RiskProfile. Allocation engine (next spec) consumes both.
18. Added Phase 8 to BACKLOG.md: a separate UX/UI case study for Behance,
    built in Figma, styled after the Donor Hub Blood Donation App case
    study — independent track from the engineering phases.
19. docs/specs/03-allocation-engine.md written: base allocation table per
    risk_band × income_tilt adjustment deltas → clamp → renormalize,
    across the 6 asset classes. Emits UserOnboarded event for Phase 2.
20. Onboarding UI wireframe (7 screens, ASCII, docs/diagrams/wireframes/),
    sequence diagram (docs/diagrams/sequence/onboarding.md), and C4
    Component diagram for the Onboarding monolith
    (docs/diagrams/c4/component-onboarding.md) all done. Also backfilled
    the C4 Context and Container diagrams into docs/diagrams/c4/ as ASCII
    (they'd only been shown in chat/Artifact before, never saved).
    Phase 1's design work is now fully done — nothing coded yet.
21. Monorepo scaffolded: npm workspaces (root package.json), apps/web
    (Next.js 16 + TypeScript, via create-next-app), apps/simulation,
    apps/market-data, apps/performance-tracking, apps/insight-ai (package.json
    stubs, code pending their own phase), packages/shared.
22. AuthModule built in apps/web: Prisma 7 schema (User/Account/Session/
    VerificationToken matching @auth/prisma-adapter's contract, plus
    RiskProfile with all fields from specs 01/02/03), NextAuth v5 config
    with Google/GitHub providers and a createUser event that seeds an
    empty RiskProfile — matches docs/specs/01-auth-user-schema.md exactly.
    Uses @prisma/adapter-neon (Prisma 7 requires a driver adapter now, no
    more bare DATABASE_URL). Build + typecheck + lint all pass.
23. ProfileModule built: GET/PATCH /api/profile via a UserRepository
    (matches the component diagram — controllers never touch prisma
    directly). PATCH only updates name/image, never risk fields. Build/
    typecheck/lint all pass. Still no real DB connected to actually run it.
24. Real Neon project created (pathfolio, US East 2 Ohio, Postgres only —
    other Neon add-ons like Object Storage/AI Gateway/Neon Auth left off
    since PathFolio uses R2/Claude/NextAuth instead). Connection string
    wired into apps/web/.env (DATABASE_URL pooled for runtime, DIRECT_URL
    unpooled for CLI migrate — pooler doesn't support the advisory locks
    migrate needs). `prisma migrate dev` ran successfully — real tables
    exist on Neon now. Verified both the CLI (direct) and runtime (pooled,
    via @neondatabase/serverless) connections actually work.
25. Google + GitHub OAuth apps created, credentials wired into .env. Dev
    server started and `/api/auth/providers` confirms both providers
    configured with correct callback URLs. Handed off to user to actually
    click through a real login in their browser (can't drive OAuth consent
    screens headlessly).
26. Real login verified end-to-end: user logged in via browser, confirmed
    in Neon that it created exactly 1 User row + 1 empty RiskProfile row
    (riskScore/riskBand null, as designed) — spec 01 fully working, not
    just typechecking. AuthModule + ProfileModule are done and proven.
27. RiskScoringModule + AllocationEngineModule built (spec 02/03 math,
    exactly as approved), plus OnboardingController
    (GET/POST /api/onboarding/questionnaire) and EventPublisher (stub —
    Upstash Redis not provisioned yet, no consumer exists until Phase 2,
    logs instead of publishing for real). Verified via a temporary debug
    route (deleted after): normal case matches the base allocation table
    exactly; Conservative+IncomeFocused correctly clamps Crypto to 0 and
    renormalizes the rest back to 100%. Build/typecheck/lint all pass.
    Phase 1 (Onboarding) is now functionally complete except the event
    bus being a stub — that's intentionally deferred to Phase 2.
28. Onboarding UI built: /onboarding page, 7-screen flow matching the
    wireframe exactly, wired to the real API (fetches question defs,
    posts answers, renders the returned allocation as bars). Added
    SessionProvider (src/app/providers.tsx) so next-auth/react's
    useSession/signIn work client-side. Fixed a react-hooks lint error
    (setState-in-effect) by deriving the displayed step at render time
    instead of syncing it via an effect. Build/typecheck/lint all pass;
    dev server up, handed to user to click through in a real browser.
29. Phase 1 confirmed working end-to-end by the user clicking through the
    real /onboarding flow in a browser. Phase 1 (User & Onboarding) is
    now fully done — spec, diagrams, backend, UI, all verified live.
30. docs/specs/04-portfolio-simulation.md written: create/list/delete
    scenarios, Draft/Active/Archived lifecycle, seeded from UserOnboarded
    (this is the real consumer the EventPublisher stub was waiting on).
    Data lives in MongoDB Atlas, not Postgres, per the storage split.
31. Upstash Redis + MongoDB Atlas provisioned (real accounts, free tier).
    Credentials saved to apps/web/.env (Redis) and apps/simulation/.env
    (Mongo + Redis) — never written to any tracked/markdown file. Both
    connections smoke-tested for real (Redis PING → PONG, Mongo ping →
    {ok:1}).
32. Moved Allocation type + USER_ONBOARDED_STREAM/UserOnboardedEvent into
    packages/shared (per REQUIREMENTS.md NFR-M-2 — no duplicating shared
    types per service), apps/web updated to import from there. Real
    EventPublisher built in apps/web (replaces the stub): XADDs to Redis
    Streams via @upstash/redis.
33. apps/simulation fully built and verified for real: Fastify + native
    `mongodb` driver (not Prisma — Prisma 7 doesn't support Mongo yet,
    only v6 does, not worth mixing versions for one collection).
    PortfolioRepository, REST routes (create/list/delete/activate/
    archive), and a trusted-caller auth pattern (x-internal-api-key +
    x-user-id headers — apps/web verifies the real session and forwards
    the userId; no real API Gateway until Phase 6, so this is the interim
    trust boundary). worker.ts consumes UserOnboarded via Upstash's
    XREADGROUP, polling every 2s since Upstash's REST API can't do a
    real blocking XREAD. Verified live end-to-end: published a real
    event → worker picked it up → correct Portfolio doc appeared in
    Mongo; REST API tested for create/list/delete/401-unauthorized/
    400-invalid-allocation, all correct. Caught and fixed one real bug
    along the way — the Mongo driver mutates inserted docs to add `_id`,
    which was leaking alongside our own `id` field in API responses.
34. State diagram written (docs/diagrams/state/portfolio-lifecycle.md):
    Draft → Active → Archived, delete allowed from any state, no path
    back out of Archived.
35. Dashboard UI built: /dashboard lists scenarios with Activate/Archive/
    Delete buttons, talking to apps/web's own proxy routes
    (/api/simulation/portfolios/*) which forward to apps/simulation with
    the trusted-caller headers — the browser never sees the internal API
    key. Onboarding's result screen now links to it instead of the
    "Phase 2 doesn't exist yet" placeholder message.
36. Hit and fixed a real cross-workspace build conflict: packages/shared
    needed `.js`-suffixed relative imports for apps/simulation's strict
    Node ESM resolution, but that broke apps/web's Turbopack build
    entirely ("module has no exports"). Fixed by switching
    apps/simulation's tsconfig to `moduleResolution: bundler` (matching
    apps/web) and dropping the `.js` suffixes everywhere for one
    consistent style across the monorepo. Full build + typecheck clean
    on both workspaces after the fix; all 3 processes (web, simulation,
    worker) verified running together.
37. Caught a real product-scale mistake: onboarding + dashboard UI copy
    was written in Vietnamese (matched chat language) instead of English
    — wrong, since PathFolio is an employer-facing portfolio piece.
    Fixed all UI text in questions.ts, onboarding/page.tsx,
    dashboard/page.tsx to English; saved a feedback memory so this
    doesn't happen again on future screens.
38. Backfilled a UserOnboarded event for the user's existing test account
    (created before the real event bus existed) so the dashboard shows
    real data instead of an empty state — looked up their real userId in
    Neon, published the event via Upstash, worker picked it up and
    created their first Portfolio in Mongo.
39. Phase 2 confirmed working end-to-end by the user: /dashboard shows
    "My First Portfolio" (Draft) with working Activate/Archive/Delete
    buttons, all UI text in English. Phase 2 (Portfolio Simulation) is
    now fully done.
40. docs/specs/05-market-data.md written: representative instrument per
    asset class (VOO/BND/GLD via Finnhub, BTC-USD via CoinGecko, Cash
    flat/no API), cache-first via Upstash Redis (5min TTL), rate limiting
    as a separate belt-and-suspenders layer on top of the cache.
41. Finnhub API key obtained, saved to apps/market-data/.env, smoke
    tested for real (VOO quote came back correctly).
42. apps/market-data fully built and verified live: Fastify + Finnhub
    (VOO/BND/GLD) + CoinGecko (BTC) + simulated flat Cash rate, cache-
    first via Upstash Redis (5min TTL), rate limiting via
    @upstash/ratelimit gating the provider-fetch path specifically (not
    every request — the cache already absorbs most traffic). Verified
    for real: 401 with no auth header, all 5 asset classes return real
    live prices, second call ~9x faster from cache hit, unknown asset
    class returns 400. Phase 3 (Market Data) is done.
43. docs/specs/06-performance-tracking.md written: tumbling-window
    snapshot job, $10,000 notional starting value, weighted % change
    across the 6 asset classes (5 from Market Data + a flat simulated
    rate for Real Estate). Identified that Simulation needs a new
    internal endpoint (all-users' Active portfolios, not one user's).
44. Added GET /internal/active-portfolios to apps/simulation (key-only
    auth, no x-user-id — crosses all users on purpose). Hit and resolved
    a real infra outage along the way: Mongo connections started failing
    with a raw TLS handshake error, traced to the dev machine's IP
    changing and falling off Atlas's Network Access allowlist — fixed by
    the user re-adding their current IP in the Atlas dashboard. Verified
    live: create → activate → the new endpoint lists it without needing
    x-user-id, unauthorized calls still 401.
45. Extracted the trusted-caller auth pattern (duplicated in apps/
    simulation and apps/market-data) into packages/shared/auth/
    internal-caller.ts, now that a 3rd service (Performance Tracking)
    needs it too — matches the earlier note this would happen. Caught and
    fixed a real bug during the extraction: apps/market-data's local copy
    only checked the API key, but the sed-based import swap pointed it at
    the userId-requiring variant instead — wrong, since prices aren't
    user data. Fixed to use requireInternalKeyOnly and corrected
    05-market-data.md's wording to match. Re-verified both services live
    after the refactor — no regressions.
46. apps/performance-tracking fully built and verified live: interval-
    based snapshot worker (SNAPSHOT_INTERVAL_SECONDS, not calendar cron —
    matches CLAUDE.md's configurable-interval decision), calls
    Simulation's internal endpoint + Market Data's /prices, computes
    weighted % change across all 6 asset classes (Real Estate gets the
    same flat-rate treatment as Market Data's Cash), $10,000 notional
    baseline on first snapshot. GET /portfolios/:id/snapshots serves the
    history for the UI, scoped by both portfolioId and userId. Verified
    live end-to-end across all 4 backend processes: created + activated a
    real portfolio, first snapshot came back exactly $10,000/0%, second
    snapshot 30s later came back $10,043.67/+0.437% — hand-checked the
    weighted-average math against the real live prices and it matches.
    Phase 4's service is done; UI + sequence diagram still open.
47. Sequence diagram written (docs/diagrams/sequence/performance-snapshot.md):
    the timer-driven counterpart to onboarding.md's user-driven flow — no
    user in the diagram at all, deliberately, since the whole point of a
    tumbling window job is that nothing external triggers it.
48. Performance history UI built: /portfolio/[id] page with a hand-rolled
    inline SVG line chart (no charting library needed for a handful of
    points) + a value/change/date table, backed by a new
    /api/performance proxy route (same trusted-caller-forwarding pattern
    as the simulation proxy). Dashboard portfolio names now link to it.
    Build/typecheck/lint all pass. Handed to user to activate their real
    portfolio and watch the chart fill in live over the next couple of
    snapshot cycles.
49. User caught a real UX gap: the first chart was a bare line with no
    axis, no units, no summary — no actual insight readable from it.
    Loaded the dataviz skill and rebuilt the page properly: a hero number
    (current value + total % change since first snapshot, the actual
    headline), a chart with y-axis $ gridlines, x-axis start/end dates,
    an emphasized end-dot, and a crosshair+tooltip hover layer; the old
    raw table demoted into a collapsed `<details>` instead of competing
    with the chart. Build/typecheck/lint all pass.
50. Also debugged a real transient Activate failure (400 from Simulation,
    traced via temporary debug logging + a direct curl reproduction) —
    resolved itself, likely a stale dev-server compile from mid-edit;
    removed the debug log once confirmed working.
51. User asked a good follow-up question: the hero number shows overall
    change, but not *why* — which asset classes drove it. Extended
    apps/performance-tracking to store `assetContributions` per snapshot
    (each of the 6 classes' percentage-point contribution to that
    period's change, computed once at snapshot time so old snapshots
    stay historically accurate rather than being recalculated against
    today's prices). Verified live: a fresh snapshot's contributions sum
    to exactly its valueChangePercent. Older snapshots (from before this
    change) simply lack the field — UI needs to handle that. Next: build
    the breakdown UI itself.
52. Built the "What moved it this period" breakdown UI: a diverging bar
    per asset class radiating from a center midline, colored by sign
    (green helped / red hurt) rather than by asset identity — the label
    already names the class, so a categorical hue would double-encode
    the same information. Sorted by impact magnitude. Only renders when
    the latest snapshot has assetContributions (guards against the older
    snapshots that predate this field). Build/typecheck/lint all pass.
53. User asked to drill further: which individual holdings make up
    Stocks/Crypto, not just the class-level number. Decided scope with
    user: real 5-stock basket for Stocks (AAPL/MSFT/NVDA/AMZN/GOOGL,
    fixed weights) and BTC+ETH for Crypto; Bonds/Gold/Cash/Real Estate
    stay single-instrument (no natural "basket" story for them).
    Reworked apps/market-data's response shape: every class now returns
    `{changePercent, asOf, holdings[]}` instead of one flat quote —
    holdings has 1 entry for single-instrument classes, 5 or 2 for the
    baskets. CoinGecko's multi-id support fetches BTC+ETH in one call.
    Fixed Performance Tracking's now-stale local PriceQuote type
    (declared symbol/price fields that no longer exist for basket
    classes — unused, but a real type-vs-runtime mismatch caught before
    it bit anyone). Verified live: hand-checked the weighted average for
    both baskets against real prices (exact match), confirmed
    bonds/gold/cash still return correctly in the new wrapper shape, and
    reran the full 4-service chain end-to-end with no breakage. Next:
    surface holdings in the UI drill-down.
54. Added apps/web's proxy to Market Data (/api/market-data/prices) — same
    trusted-caller-forwarding shape as the other two proxies, except no
    x-user-id is sent (Market Data doesn't need one), while the proxy
    route itself still requires a real session so the data stays behind
    login regardless. Build/typecheck/lint all pass.
55. Built the holdings drill-down: Stocks/Crypto rows in the breakdown
    get a chevron and expand on click into a per-holding table (symbol,
    weight, price, change) — only classes with >1 holding are drillable,
    so Bonds/Gold/Cash/Real Estate render as plain non-interactive rows.
    Treated as a live "right now" view rather than historical (fetched
    fresh from Market Data, not stored per-snapshot) since the basket's
    composition is fixed — only prices move day to day, and the chart
    above already covers the time dimension. Build/typecheck/lint all
    pass. Phase 4 (Performance Tracking) is now done, including the
    drill-down the user asked for beyond the original spec.
56. Fixed a CSS specificity bug in the holdings table: `.holdingsTable td
    { color: #666 }` (element+class, specificity 0,1,1) was silently
    beating `.positive`/`.negative` (single class, 0,1,0), so the
    Change column never actually showed green/red despite the class
    being applied correctly in the JSX. Fixed with an explicit
    `.holdingsTable td.positive`/`.negative` override. Checked every
    other change-percent spot in the app (hero delta, breakdown bars,
    the main snapshot table) — none had a competing color rule, so this
    was the only place actually broken.
57. Full docs sync pass: REQUIREMENTS.md got FR-MKT-5/6 (baskets,
    holdings in the response) and FR-PERF-4 (contribution breakdown +
    drill-down), NFR-S-3's wording corrected to match what's actually
    enforced. Specs 05/06 rewritten to describe the basket/contribution
    behavior for real; specs 01-04 marked "Implemented & verified live"
    instead of sitting at "Draft" despite being fully built. Added a
    concurrency guard to the snapshot worker (`isRunning` flag) so
    NFR-S-3's claim is actually true, not just written down. CLAUDE.md
    got a full 2026-09-03 entry covering Phases 2-4, the BFF-pattern
    discovery, the basket decision, and both bugs caught along the way.
    All 4 backend workspaces reverified clean (typecheck) after the pass.
58. docs/specs/07-insight-ai.md written: a stronger-tier model (not the
    cheapest — the insight text is the headline feature, quality matters
    more than cost here specifically), pdfkit for PDF export, Resend for
    email, Insights collection in Mongo to log past comparisons. Noted a
    real dependency: since Onboarding lives inside apps/web (the modular
    monolith), Insight/AI needs a new internal endpoint on apps/web
    itself to read RiskProfile — not a separate service call like the
    other two.
59. Swapped LLM provider from Claude/Anthropic to Google Gemini (Flash
    tier) — Anthropic's API has no real free tier for a demo-scale
    personal project. Updated spec 07, the C4 Context/Container diagrams,
    and REQUIREMENTS.md's FR-AI-2 to match. Next: get a free Gemini API
    key and code the comparison endpoint.
60. Gemini API key obtained (Google AI Studio, free), verified with a raw
    curl before wiring it up. Added apps/web's internal-only
    `/api/internal/risk-profile` endpoint (hand-rolled auth, since
    Onboarding lives in Next.js, not Fastify — @pathfolio/shared's
    trusted-caller helper is Fastify-typed and doesn't apply here).
61. apps/insight-ai fully built and verified live: POST /compare gathers
    real allocation + snapshot history + risk profile across 3 different
    sources (Simulation, Performance Tracking, apps/web), builds a
    prompt, calls Gemini Flash via plain fetch (no SDK — same lightweight
    style as Market Data's providers), and logs the result to a new
    `insights` Mongo collection. Hit the same MongoDB Atlas IP-allowlist
    TLS error from the previous session (9 days idle, IP had changed
    again) — user re-added their IP, but the already-running Mongo
    clients needed a full process restart to pick up the fix (a
    `MongoClient`'s topology stays "closed" after repeated connection
    failures within the same process; re-allowing the IP doesn't revive
    it). Verified with two real scenarios: Gemini's response correctly
    referenced both portfolios' real allocations and the user's actual
    risk profile — not generic filler. Insights collection confirmed
    persisting the comparison. FR-AI-1/2 done; export (FR-AI-3/4) and
    email (FR-AI-5) still need Cloudflare R2 and Resend accounts.
62. Scenario comparison UI built: dashboard cards get a checkbox, "Compare
    N selected" appears once 2+ are picked and links to /compare?ids=...,
    which shows a multi-series line chart (fixed categorical colors, a
    legend since dataviz requires one for 2+ series) plus the real
    Gemini insight text. Hit a real Next.js build error — useSearchParams
    in a client component needs a Suspense boundary for static
    prerendering to succeed — fixed by wrapping the page in one. Build/
    typecheck/lint all pass.
63. User asked whether a design system existed — it didn't; 12+ repeated
    hardcoded hex values were copy-pasted across 4 separate CSS module
    files. Centralized them into CSS custom properties in globals.css
    (color, radius tokens) and rewrote all 4 page stylesheets to
    reference them instead of literals. Wrote docs/design-system.md as
    the actual reference doc (not just buried in CSS) — includes the
    semantic rule that positive/negative colors mean direction of
    change, never asset identity, tying back to the dataviz work in
    Phase 4. Verified the UI renders identically after the refactor
    (same values, just centralized) — build/typecheck/lint all pass.
64. User spotted a real runaway-compounding bug on the /compare chart: a
    portfolio spiking from $10,000 to $520,000. Root cause: the snapshot
    worker had been left running unattended at the 30s dev interval for
    ~30 hours (3621 snapshots), and each tick applied a *daily*
    changePercent as if it were that tick's own return — compounding a
    full day's return roughly 2880 times over. Fixed at the root (not
    just by picking a "safer" interval): every contribution is now
    scaled by real elapsed time ÷ 1 day, so the math is correct at any
    interval or after any downtime. Deleted all 3621 bad snapshots for a
    clean baseline, bumped the dev interval to 5min (now just a
    data-freshness knob, not a correctness one). Updated spec 06 and
    CLAUDE.md with the full root-cause writeup. Restarted the worker and
    confirmed both test portfolios reset to a clean $10,000/0% baseline.
65. Cloudflare R2 (scoped API token, Object Read & Write, limited to the
    "pathfolio" bucket only) and Resend API keys obtained, saved to
    apps/insight-ai/.env. User set a standing policy: every metered
    external API must stay well below free tier by design — formalized
    as REQUIREMENTS.md's new NFR-COST-1/2/3, a CLAUDE.md decision-log
    entry, and a cross-session memory so it applies to future
    integrations too, not just R2/Resend. Applied immediately: added a
    per-user Upstash rate limiter (10/hour) to POST /compare, same
    @upstash/ratelimit pattern Market Data already uses for its own
    provider calls. Verified /compare still works correctly with the
    limiter in place.
66. User caught a real gap in the guardrail design: per-user rate limits
    alone don't protect Resend's 100-email/day cap, which is per
    *account*, not per user. Fixed: every metered action now checks a
    per-user limit AND a global limit (`makeLimiterPair` in
    apps/insight-ai/src/ratelimit.ts). Then verified real free-tier
    numbers via web search instead of estimating (see REQUIREMENTS.md's
    NFR-COST-2 table) — Resend 100/day account-wide (global cap: 50/day,
    50% margin), Gemini 500-1500/day depending on source (global cap:
    100/day, ≤20% margin, and no billing risk either way since the free
    tier just 429s), R2 1M Class A ops/month (global cap: ~3,000/month,
    0.3%). Typecheck clean.
67. Wrote docs/dev-setup.md ahead of a context clear — how to start all 5
    processes (with the cwd gotcha called out explicitly), the Mongo
    Atlas IP-allowlist failure mode and its fix, test account/portfolio
    ids for quick manual testing, and the concrete Phase 5 next-steps
    (PDF export → email → their UI → sequence diagram) so a fresh session
    can resume without re-deriving any of this.
68. Built PDF export (`POST /portfolios/:id/export`) and email
    (`POST /portfolios/:id/email`) on apps/insight-ai, wiring in the
    `exportLimiter`/`emailLimiter` that had been sitting unused since
    entry 66. PDF built with pdfkit: allocation + a locally-templated
    reasoning sentence when a scenario has no snapshots yet, or a
    hand-drawn line chart (plain pdfkit vector calls, no charting
    library) + the most recently saved `/compare` insight once it does —
    export never calls Gemini itself, it only reads what's already on
    record. Added `apps/insight-ai/src/r2.ts` (S3-compatible client,
    `@aws-sdk/client-s3` — the one place this service reaches for an SDK
    instead of plain fetch, since presigned URLs need SigV4 signing) and
    `email.ts` (Resend, links to the signed URL rather than attaching
    the PDF, since the URL already expires in 24h on its own). Extended
    `fetchRiskProfile` to also return the user's email (added to
    apps/web's existing `/api/internal/risk-profile` response) so the
    email route has somewhere to send to. Verified against real data:
    exported the live "My First Portfolio" (36 real snapshots) and got
    back a real signed R2 URL whose PDF downloaded and rendered
    correctly (chart, allocation, real Gemini insight text all present);
    verified the no-snapshot branch against a throwaway test portfolio;
    sent a real email via Resend's sandbox sender and confirmed
    `{"sent":true}`. Caught and fixed one real bug during testing: the
    chart's max-value label was drawn above the chart at a fixed
    negative offset and collided with the "Performance" heading text —
    moved it inside the chart's top-left corner instead. Also caught
    mid-testing that insight-ai wasn't actually running in `tsx watch`
    mode (a plain one-shot `tsx src/index.ts`), so code edits weren't
    live-reloading; had to restart it manually, and a stray `pkill -f
    "src/index.ts"` briefly killed simulation/market-data/performance-
    tracking too (they share the same entry-file name) — all three
    restarted clean with no data loss. Typecheck clean on both
    apps/insight-ai and apps/web. Still open: apps/web proxy routes +
    UI buttons for export/email (Phase 5's UI item), and the sequence
    diagram.
69. Also discovered mid-session that the "Scenario comparison view UI"
    backlog item (chart + AI insight text) was already built in a prior
    session (`apps/web/src/app/compare/page.tsx`, hand-drawn SVG
    multi-series chart following the dataviz skill's rules, wired from
    the dashboard's multi-select checkboxes) — just never had its
    BACKLOG.md checkbox ticked. Marked it done.
70. Wired entry 68's export/email routes into apps/web: added
    `exportPortfolioReport`/`emailPortfolioReport` to
    `src/lib/insight-client.ts` (new `InsightServiceError` class carries
    the upstream status code through), two proxy routes
    (`/api/insight/portfolios/[id]/export`, `.../email`, same
    session-auth pattern as the existing `/api/insight/compare` route),
    and "Export PDF"/"Email report" buttons on each dashboard portfolio
    card with a per-card pending/success/error status line that
    auto-clears after 4s. Verified live in an actual browser (Playwright,
    not just typecheck): created a temporary NextAuth database session
    row for the test account (no OAuth flow needed for local testing)
    and clicked both buttons for real — "Export PDF" opened a real
    signed R2 PDF in a new tab, "Email report" showed "Sent!" and a real
    email landed via Resend. Deleted the temporary session afterward.
    Typecheck and lint clean (one unused-var warning fixed by swapping a
    destructuring-omit pattern for `Object.fromEntries`/`filter`).
71. Wrote `docs/diagrams/sequence/scenario-compare.md` — Phase 5's last
    remaining item, closing the phase out. Covers create (manual
    `POST /portfolios`) through compare (`/compare`'s two independent
    reads from Simulation and Performance Tracking, the
    apps/web-internal RiskProfile read, Gemini, and the `Insights`
    write), same ASCII style as the existing onboarding/performance-
    snapshot diagrams. Phase 5 is now fully complete.
72. Caught a real inaccuracy in entry 71's diagram while starting Phase
    6: it showed a "New scenario" step going through a Web App proxy to
    `POST /portfolios`, but no such proxy route exists — the dashboard
    only lists/activates/archives/deletes/exports/emails, nothing
    creates. The only real creation paths are the automatic one
    (`onboarding.md`'s `UserOnboarded` → Simulation) and direct calls to
    apps/simulation itself (how the manual test scenarios got made).
    Fixed the diagram to reference `onboarding.md` for "creates" instead
    of fabricating a UI flow that isn't there, and start the actual
    sequence at "select 2+, click Compare".
73. Wrote OpenAPI 3.1 specs for Phase 6's first item —
    `docs/api/onboarding.yaml` and `docs/api/simulation.yaml`. Scoped
    each to the service's own *real* API rather than the web proxy
    layer, on purpose: Onboarding's spec documents the actual
    apps/web routes (questionnaire, profile) with session-cookie auth,
    since it has no separate deployable; Simulation's spec documents
    apps/simulation's own internal API (portfolios CRUD) with the
    x-internal-api-key/x-user-id trusted-caller headers, since that's
    the real microservice contract worth showing for a system-design
    case study. Schemas cross-checked against the actual Prisma schema
    (RiskProfile/User) and route handlers, not guessed. Caught and fixed
    a real spec bug via `npx @redocly/cli lint`: OpenAPI 3.1 uses plain
    JSON Schema, so `nullable: true` isn't valid there (that's a 3.0-ism)
    — switched every nullable field to `type: [x, "null"]` /
    `oneOf: [{$ref}, {type: "null"}]`. Both files now lint clean (0
    errors, a few cosmetic warnings about localhost server URLs and
    missing `license`/4xx-on-GET, left as-is for a local dev spec).
74. Caught a real product gap while starting Phase 6's user journey
    diagram: core value prop #3 ("create multiple scenario portfolios to
    compare") had no way for an actual user to create a second scenario
    — the dashboard only ever listed/activated/archived/deleted/
    exported/emailed. `POST /portfolios` existed on apps/simulation
    itself but nothing in apps/web called it; every "second scenario"
    up to now was created by a direct `curl` during testing. Fixed:
    added `createScenario` to `src/lib/simulation-client.ts`, a `POST`
    handler on `/api/simulation/portfolios/route.ts` (validated with
    `isValidAllocation` from `@pathfolio/shared` before forwarding), and
    a "+ New scenario" form on the dashboard (name + 6 asset-class %
    inputs, live running total, blocks submit unless it's 100). Verified
    live in a real browser: created a real "Retirement Focus (test)"
    scenario end to end (appeared as Draft on the dashboard), and
    confirmed the 100%-sum validation actually blocks a bad submission
    client-side. Cleaned up the test scenario and session afterward.
    Typecheck and lint clean. The core loop (create → compare → export/
    email) is now genuinely reachable by a real user, not just testable
    via direct service calls.
75. Wrote `docs/diagrams/journey/first-time-user.md` — Phase 6's user
    journey item, now that entry 74 actually closed the create-scenario
    gap it would otherwise have had to route around. Deliberately
    motivation-focused (why the user moves to each next step) rather
    than screen-by-screen (the wireframe's job) or request/response
    (the sequence diagrams' job) — cross-references both instead of
    duplicating their detail. Calls out one deliberate product
    non-feature: no in-place scenario editing, by design
    (docs/specs/04-portfolio-simulation.md's Scope).
76. Wrote `docs/diagrams/deployment.md` — Phase 6's deployment diagram,
    and folded the Load Balancer note into it rather than as a separate
    item (both backlog checkboxes closed by one diagram). Surfaced a
    real decision that hadn't been made yet before drawing it: the
    project's only prior hosting assumption (CLAUDE.md 2026-08-29,
    "services are serverless on Vercel") doesn't actually hold — the 4
    Fastify microservices are long-running `app.listen()` processes, and
    performance-tracking's snapshot job is a `setInterval` loop in that
    same process, neither of which a stateless Vercel serverless
    function can host without a rewrite. Asked the user; decided
    apps/web stays on Vercel (fits its stateless shape) while the 4
    microservices + worker move to Railway (hosts long-running processes
    unmodified, no rewrite needed). Updated CLAUDE.md's tech stack
    section and progress log to reflect the real decision instead of
    silently editing the outdated 2026-08-29 entry.
77. Built `apps/api-gateway` — Phase 6's last item, and the biggest one:
    a real reverse-proxy service (Fastify + `@fastify/http-proxy`,
    not hand-rolled) routing by path prefix (`/simulation`,
    `/market-data`, `/performance`, `/insight`) to the 4 existing
    microservices, purely a router — no auth logic of its own, each
    downstream service still enforces `x-internal-api-key`/`x-user-id`
    exactly as before. Caught a real CVE while installing: the version
    initially pinned (`@fastify/http-proxy` <=11.4.3) has a critical
    advisory (connection-header abuse strips proxy-added headers,
    GHSA-gwhp-pf74-vj37) — bumped to 11.6.2, `npm audit` clean.
    Rewired all 4 of `apps/web`'s client files
    (`src/lib/{simulation,market-data,performance,insight}-client.ts`)
    to call `${GATEWAY_URL}/<prefix>` instead of their own
    `*_SERVICE_URL`, removed those 4 now-unused env vars from
    `apps/web/.env`. Deliberately scoped to edge traffic only —
    Insight/AI's own direct calls into Simulation/Performance Tracking
    stay as they were, bypassing the gateway, same as a real
    microservice mesh. Verified live end to end in a real browser
    (Playwright, temp session trick again): dashboard portfolio list,
    creating a scenario, and a full compare (chart + real Gemini
    insight) all worked correctly routed entirely through the new
    gateway. Noticed one pre-existing, unrelated flake while testing:
    `/compare` returns a raw 500 with an empty body on a transient
    Gemini 503 (compounded by React StrictMode's double-effect in dev)
    — not caused by this change, flagged to the user, not fixed here
    (out of scope for the Gateway task). Wrote
    `docs/specs/08-api-gateway.md`, updated the C4 container diagram and
    `docs/diagrams/deployment.md` to show the Gateway's real position,
    updated `docs/dev-setup.md` for the new 6th process. Phase 6 is now
    fully complete.
78. Ran 3 Phase 7 items in parallel (user asked for it explicitly): a
    background agent wrote `docs/case-study.md` (problem → design
    decisions → trade-offs → outcome, ~1,970 words, sourced only from
    CLAUDE.md/REQUIREMENTS.md/BACKLOG.md/FEATURES.md, no invented
    detail), a second background agent rewrote the stale `README.md`
    (previously described a planned `src/services/*` layout that never
    matched what got built — now describes the real `apps/*` npm-
    workspaces monorepo, links every diagram and both OpenAPI specs).
    Reviewed both outputs before trusting them; fixed one small staleness
    (README said the case study wasn't done yet, written moments before
    the case-study agent's own completion landed).
    Kept `git init`/commit sequential and separate from the two parallel
    writers on purpose — running a commit concurrently with two agents
    still writing files risked committing a half-finished state. Added
    `.next/` to `.gitignore` (Next.js build output wasn't excluded
    before), then `git init` — which turned out to already produce one
    complete, clean initial commit automatically (250 files) rather than
    needing a manual `git add`+`git commit`. Verified it before trusting
    it: no `.env` file anywhere in the commit, working tree clean
    afterward, both the new README and case-study present and matching
    the latest edits. No remote configured yet — pushing to an actual
    GitHub repo is Phase 7's separate "live demo" item, not done here.
79. Built out Phase 8 (Behance UX case study) via the Figma MCP
    connector: research (`docs/ux/research.md` — problem statement,
    persona "Chloe Ngata", user flow, deliberately skipping empathy
    mapping/competitive analysis/usability testing since there's no real
    user pool for a solo demo), then wireframes, then hi-fi mockups,
    then a wired prototype, all in a new Figma file ("PathFolio — UX
    Case Study", https://www.figma.com/design/uai3qul7EejytWFnnXvfN0).
    Referenced two real Behance case studies for structure/style: the
    user-provided Donor Hub example and the user's own prior project
    "Fortress — Wealth & Rental Portfolio App" (published the day
    before this session, also built with Figma MCP + Claude) —
    Fortress's Role/Tools/Scope framing and "one north-star number per
    screen" pattern are worth carrying into the eventual case-study
    write-up.
    Caught and fixed two real mistakes along the way, both surfaced by
    the user's own review rather than self-caught: (1) the entire first
    wireframe pass was built at a 320px mobile-app frame size, copying
    the mobile-app precedent from Donor Hub/Fortress, when PathFolio is
    actually a web app (`apps/web`, browser-based, real max-width 640px)
    — rebuilt all 6 screens at desktop web frame sizes; (2) hi-fi
    screens initially left huge dead whitespace around a narrow centered
    column on a 1280px canvas — fixed by adding a left sidebar app shell
    (logo, nav, user profile) to the 3 post-auth screens, which also
    gave the case study a more complete "real app" feel. Also caught,
    unprompted this time: the wireframes' accent color
    ({r:0.15,g:0.4,b:0.35}, a forest green) was near-identical to
    Fortress's forest-green+gold identity — asked the user, then
    recolored every screen to a blue-based palette instead, including a
    stray gold persona-avatar color that the first color-replacement
    pass missed.
    Hi-fi mockups add real visual polish beyond the wireframe pass:
    drop shadows, a gradient hero background + logo mark on Sign in,
    color-coded allocation bars/swatches per asset class, a
    gradient-fill area chart with a highlighted endpoint dot on Compare,
    and status/change-percent detail on dashboard cards.
    Built a real clickable prototype: 12 `ON_CLICK` → `NAVIGATE`
    reactions (Sign in → Onboarding question → Onboarding result →
    Dashboard, then Dashboard ↔ New scenario ↔ Compare via both primary
    CTAs and sidebar nav items) — verified by reading every reaction's
    `destinationId` back rather than assuming the writes took.
    Still open: the Behance-style case-study write-up and the actual
    publish (Behance publishing is a manual step only the user can do).
80. Caught and fixed a real prototype bug the user found by actually
    clicking it (screenshot showed a blurred/ghosted cross-fade between
    Sign-in and Onboarding-question): the `SMART_ANIMATE` transition on
    all 12 reactions was trying to morph matching-named layers between
    frames, but dozens of wrapper frames across different screens were
    all named the generic default "Frame" — Smart Animate matched
    unrelated layers across totally different screens, producing the
    ghosting. Fixed by switching every reaction to `DISSOLVE`, then
    (when the user still saw the same artifact — turned out to be a
    stale cached Present tab) switched again to no transition at all
    (instant swap) to remove any possible animation-timing ambiguity.
    User confirmed it works after reopening the Present link fresh.
    Also verified the "Anyone with the link can view" sharing setting
    actually works for a logged-out visitor — cleared cookies in the
    Playwright-controlled test browser and reloaded the proto URL fresh
    rather than trusting the user's screenshot alone (a real check, not
    a formality: the browser was mid-locked by a concurrent Playwright
    session from this session's own earlier work, so the first two
    verification attempts errored out before one finally worked).
    Wrote `docs/ux/case-study.md` — the actual Behance-style write-up
    (Role/Tools/Scope framing borrowed from the user's own Fortress
    case study, the "one north-star question per screen" pattern, key
    screens walkthrough, the color-identity decision, honest before/
    after on both real mistakes caught during the build). Phase 8 is
    now fully complete except the manual Behance publish step itself.
81. Exported 8 real screens from the Hi-Fi/Cover/User-Flow Figma pages
    (`download_assets`, 2560px PNGs) and packaged
    `docs/ux/behance-package/` — images + `case-study-text.md`
    (copy-paste-ready module text) + `links.md` + `INSTRUCTIONS.md` (a
    13-module step-by-step: cover image choice, title/tags/description,
    module order, a pre-publish checklist, troubleshooting) — self-
    contained enough to hand to a different agent or the user with no
    other context. User's own request, explicitly for handoff.
82. Housekeeping: found and fixed a self-inflicted FEATURES.md ordering
    bug — entries 79/80 (Phase 8) had been inserted right after entry
    70 instead of after 78, because an earlier `Edit` call anchored on
    stale surrounding text instead of the file's true end at the time.
    Content and numbers were both already correct, only the position
    was wrong (70 → 79 → 80 → 71 → ... → 78 instead of 70 → 71 → ... →
    78 → 79 → 80). Relocated the block, no content changes. Also
    reflected the *other* concurrent session's work here for
    continuity: it deployed PathFolio live (`pathfolio-web.vercel.app`
    on Vercel, gateway + 4 microservices on Railway) and pushed the
    repo to `github.com/binhvo9/pathfolio` (public) — see CLAUDE.md's
    2026-09-14 entry for the full deploy log, including the open
    follow-up to rotate `AUTH_SECRET` and the OAuth client secrets
    since real values passed through that chat session and the repo is
    now public.
