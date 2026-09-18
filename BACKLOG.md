# PathFolio — Step-by-Step Build Plan

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done

This is a sequential plan, not a wishlist — steps are ordered by dependency,
top to bottom. Do them roughly in order; don't start Phase 3 work before
Phase 1 is done, since later services depend on earlier ones existing.

Before starting a step marked (spec), write `docs/specs/NN-name.md` first
(see [docs/specs/README.md](docs/specs/README.md)). When a step is done,
append it to the Completed list in [FEATURES.md](FEATURES.md).

---

## Phase 0 — Foundation (nothing else can start until this is done)

- [x] Tech stack decision: Next.js, Neon Postgres + NextAuth.js, MongoDB
      Atlas, Upstash Redis, Cloudflare R2 — see [CLAUDE.md](CLAUDE.md)
      under "Tech stack"
- [x] C4 Context diagram — system in the big picture
- [x] C4 Container diagram — cleaned-up version of the service map

## Phase 1 — User & Onboarding (modular monolith; everything downstream needs a user + a portfolio to exist)

- [x] (spec) Auth + user schema, basic CRUD — coded + verified against real Neon DB
- [x] (spec) Risk questionnaire → risk score calculation — coded + verified
- [x] (spec) Default allocation suggestion engine (rule-based first) — coded + verified
- [x] Onboarding interview UI (beginner-friendly, no jargon) — low-fi wireframe done, real build pending
- [x] Sequence diagram: user completes onboarding
- [x] C4 Component diagram — inside the Onboarding monolith

## Phase 2 — Portfolio Simulation (depends on Phase 1: needs a user + default allocation to seed the first scenario)

- [x] (spec) Portfolio Simulation service: create/list/delete scenario portfolios — coded + verified live
- [x] Event bus setup: Upstash Redis Streams, wired Onboarding → Simulation — verified live
- [x] Dashboard UI: list of user's scenario portfolios
- [x] State diagram: portfolio lifecycle (Draft → Active → Archived)

## Phase 3 — Market Data (independent of Phases 1–2, but Performance Tracking needs it — build in parallel or right before Phase 4)

- [x] (spec) Market Data service: fetch + cache real ETF/stock prices (pick a free API) — coded + verified live

## Phase 4 — Performance Tracking (depends on Phase 2 + Phase 3: needs scenarios to track and prices to price them with)

- [x] (spec) Performance Tracking service: tumbling window job (daily or weekly) — coded + verified live
- [x] Performance history view UI (per portfolio, over time)
- [x] Sequence diagram: scheduled performance snapshot (tumbling window)

## Phase 5 — Insight/AI (depends on Phase 4: needs performance snapshots to compare)

- [~] (spec) Insight/AI service: prompt design + integration, triggered on button click — comparison (POST /compare) coded + verified live; export/email below still open
- [x] (spec) Export scenario as PDF report → Cloudflare R2, signed download
      link. Report is a snapshot at export time, not a fixed template: just
      target allocation + reasoning if the scenario is new, plus the
      performance curve and AI comparison once snapshots exist. Backend
      routes (`POST /portfolios/:id/export`, `.../email`) and apps/web
      proxy routes + dashboard buttons all coded + verified live end to
      end (real PDF opened, real email sent).
- [x] Scenario comparison view UI (chart + AI insight text) — found already
      built (`apps/web/src/app/compare/page.tsx`, wired from the dashboard's
      multi-select checkboxes) from a prior session, checkbox wasn't ticked
- [x] Sequence diagram: user creates & compares scenarios —
      `docs/diagrams/sequence/scenario-compare.md`

## Phase 6 — API contract & docs cleanup

- [x] OpenAPI spec for Onboarding + Simulation services —
      `docs/api/onboarding.yaml`, `docs/api/simulation.yaml` (lint-clean,
      `npx @redocly/cli lint`)
- [x] User journey flow diagram (beginner's first-time experience) —
      `docs/diagrams/journey/first-time-user.md`
- [x] Deployment diagram (where this actually runs — Vercel/Railway/AWS etc.)
      — `docs/diagrams/deployment.md`. Decided: `apps/web` on Vercel
      (serverless fits its stateless request shape); the 4 Fastify
      microservices + performance-tracking's worker loop on Railway
      instead (they're long-running processes — Vercel serverless
      can't host a `setInterval` worker or a persistent `app.listen()`
      without a rewrite, deferred past Phase 7).
- [x] API Gateway in front of the microservices (demonstrates the pattern —
      only makes sense because these are real separate services) —
      `apps/api-gateway`, `docs/specs/08-api-gateway.md`. `apps/web`'s 4
      client files now call one `GATEWAY_URL` instead of 4 separate
      service URLs; verified live end to end in a real browser
      (dashboard, create, compare all working through the gateway).
- [x] Load Balancer noted in front of Market Data (POC-level) — folded
      into `docs/diagrams/deployment.md` rather than a separate note:
      Vercel's routing fronts apps/web, Railway's per-service routing +
      health-check restarts front the 4 microservices, called out in
      front of Market Data specifically as the most-called service.

## Phase 7 — Ship it (portfolio packaging, do last)

- [x] Live demo deployed somewhere public — web on Vercel
      (`https://pathfolio-web.vercel.app`), gateway + 4 microservices on
      Railway. Repo pushed to `github.com/binhvo9/pathfolio` (public).
      **Follow-up not yet done:** rotate `AUTH_SECRET` + Google/GitHub
      OAuth client secrets (real values passed through this chat session
      and the repo is now public — see CLAUDE.md's 2026-09-14 entry) and
      do a full manual login test on the live site (only the OAuth
      redirect URI + a 200 response were verified so far, not an actual
      human sign-in)
- [x] Written case study (problem → design decisions → trade-offs → outcome)
      — `docs/case-study.md`
- [x] README with architecture diagrams embedded — `README.md` rewritten
      to match the real monorepo layout, links every diagram + OpenAPI spec
- [x] GitHub repo cleaned up, good commit history — git initialized,
      `.gitignore` covers `.env`/`.next`/node_modules, one clean initial
      commit (250 files, verified no secrets included), pushed to
      `github.com/binhvo9/pathfolio` (public)
- [ ] Short video/GIF walkthrough (optional but strong for recruiters)

## Phase 8 — UX/UI design case study (Behance, separate audience from Phase 7)

Independent of the engineering phases above — can start anytime, but works
best once the Onboarding/Dashboard/Comparison flows (Phase 1/2/5) are
scoped, since the case study needs real flow content to design against.

- [x] Pick which flow(s) to feature — Onboarding + Dashboard + Compare
      (user-approved 2026-09-13), matching
      `docs/diagrams/journey/first-time-user.md`
- [x] Figma project setup — new file "PathFolio — UX Case Study"
      (https://www.figma.com/design/uai3qul7EejytWFnnXvfN0), Pro plan
- [x] UX research artifacts: problem statement, persona (Chloe Ngata,
      27, Hamilton NZ), user flow diagram — `docs/ux/research.md` +
      Figma "Cover & Research"/"User Flow" pages. Empathy mapping/
      competitive analysis/usability testing deliberately skipped (no
      real user pool for a solo demo — see research.md)
- [x] Wireframes → high-fidelity mockups in Figma — 6 screens each
      (Sign in, Onboarding question/result, Dashboard, New scenario,
      Compare). Rebuilt once from an initial mobile-sized mistake to
      correct desktop-web frames; hi-fi pass added a left sidebar app
      shell, shadows, a blue brand palette (deliberately distinct from
      the "Fortress" case study's forest-green+gold), and a
      gradient-fill comparison chart
- [x] Clickable prototype for the featured flow — 12 reactions wiring
      Sign in → Onboarding (2 screens) → Dashboard ↔ New scenario ↔
      Compare, verified by reading back every reaction's destination
- [x] Case study write-up in Behance style (process, decisions,
      before/after, final screens) — `docs/ux/case-study.md`. Verified
      the public prototype link actually works for a logged-out visitor
      (cleared cookies in the test browser and reloaded fresh) before
      writing "publicly viewable, no login required" into the write-up
- [ ] Publish to Behance — manual step, only the user can do this

---

## Already done

- [x] ERD / data model

## Icebox (ideas, not committed yet — don't schedule into a phase above)

- Multi-currency support (NZD focus first, VND second given Binh's context)
- KiwiSaver-specific scenario templates
- Comparison against a benchmark index, not just other user scenarios
