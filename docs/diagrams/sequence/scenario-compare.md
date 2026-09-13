# Sequence — user creates & compares scenarios

**"Creates" here is `onboarding.md`'s flow** — the only way a scenario
exists today is the automatic one seeded from `default_allocation` when
onboarding completes (`UserOnboarded` → Simulation). There is no manual
"new scenario" UI/proxy route yet — `POST /portfolios` exists on
apps/simulation itself (`docs/specs/04-portfolio-simulation.md`) but
nothing in apps/web calls it; the dashboard only lists, activates,
archives, deletes, exports, and emails. This diagram picks up from
there: two scenarios already exist (one auto-seeded, one created via a
direct service call during testing — see `docs/dev-setup.md`), and
covers what a user actually *can* trigger from the UI: comparing them.

```
 User          Web App        Simulation     Perf. Tracking   Insight/AI     Gemini    Mongo
  |               |                |               |               |           |         |
  |--select 2+,-->|                |               |               |           |         |
  |  click Compare|                |               |               |           |         |
  |               |--GET .../snapshots (per scenario, for the chart)->|           |         |
  |               |<--Snapshot[]-------------------|---------------|           |         |
  |               |--POST /compare {portfolioIds}------------------->|           |         |
  |               |                |               |               |           |         |
  |               |                |<--GET /portfolios--------------|           |         |
  |               |                |--Portfolio[]------------------>|           |         |
  |               |                |               |<--GET .../snapshots--------|         |
  |               |                |               |--Snapshot[]--->|           |         |
  |               |<-------------------------GET /api/internal/risk-profile----|         |
  |               |--RiskProfile----------------------------------->|           |         |
  |               |                |               |               |  build prompt from |
  |               |                |               |               |  real allocation + |
  |               |                |               |               |  history + goal    |
  |               |                |               |               |--generateContent-->|
  |               |                |               |               |<--insight text-----|
  |               |                |               |               |--insertOne(Insights)-->|
  |               |<--{insightText}------------------------------|           |         |
  |<--chart + "What Gemini thinks" card------------|               |           |         |
```

**Two independent reads feed `/compare`** — Simulation for each selected
scenario's current allocation/status, Performance Tracking for its
snapshot history. `apps/insight-ai/src/export.ts`/`email.ts`
(`FEATURES.md` #68) reuse these same two reads later, just without a
fresh Gemini call — export only ever plays back the most recently saved
`Insights` document via `findLatestInsightForPortfolio`.

**Onboarding has no separate deployable to call** — its RiskProfile
lives inside apps/web (the modular monolith), so Insight/AI reaches it
via `GET /api/internal/risk-profile` on apps/web itself, not a service
URL, per `docs/specs/07-insight-ai.md`'s API/interface section.

**Synchronous throughout** — unlike `onboarding.md`'s fire-and-forget
`UserOnboarded` event, the user is waiting on screen for the comparison
result, so every step here is a direct request/response, no event bus.

References: `docs/specs/04-portfolio-simulation.md`,
`06-performance-tracking.md`, `07-insight-ai.md`,
`apps/web/src/app/compare/page.tsx`, `apps/web/src/app/dashboard/page.tsx`.
