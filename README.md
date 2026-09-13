# PathFolio

A robo-advisor for beginner retail investors in New Zealand — onboarding
interview, a suggested starter allocation, multiple simulated portfolio
scenarios to compare against each other, periodic performance tracking, and
an AI-generated comparison of which scenario is winning and why.

**This is a demo, not a financial product.** No real money, no real trades —
every portfolio is simulated. It exists to demonstrate system design and
software architecture skills for a Business/Data Analyst portfolio aimed at
NZ recruiters.

Full write-up: [`docs/case-study.md`](./docs/case-study.md) — problem,
design decisions, trade-offs, outcome.

## Architecture at a glance

Five services, split deliberately: **User & Onboarding** (auth, profile,
risk questionnaire) is a **modular monolith** — those three pieces are
always used together, so a separate deployable would just add network hops
for no benefit. **Portfolio Simulation**, **Market Data**, **Performance
Tracking**, and **Insight/AI** are real, independently deployable
**microservices**, fronted by an **API Gateway** that reverse-proxies each
request to the right service by path prefix.

- [C4 context diagram](./docs/diagrams/c4/context.md) — the system in the big picture
- [C4 container diagram](./docs/diagrams/c4/container.md) — the service map, including the modular-monolith/microservices split
- [C4 component diagram — inside Onboarding](./docs/diagrams/c4/component-onboarding.md)
- [Deployment diagram](./docs/diagrams/deployment.md) — Vercel (web) + Railway (gateway + 4 services)

## Repo structure

npm-workspaces monorepo. Each `apps/*` service is independently runnable
and deployable — this isn't one Next.js app with folders per "service."

```
pathfolio/
├── apps/
│   ├── web/                  # Next.js — Onboarding modular monolith (auth, profile,
│   │                         # risk questionnaire, Prisma/Neon) + the frontend for all flows
│   ├── api-gateway/          # Fastify reverse proxy in front of the 4 microservices below
│   ├── simulation/           # Fastify — scenario portfolios (create/list/delete)
│   ├── market-data/          # Fastify — cached real prices (stocks/crypto/etc.)
│   ├── performance-tracking/ # Fastify + tumbling-window snapshot worker
│   └── insight-ai/           # Fastify — Gemini-generated comparisons, PDF export, email
├── packages/
│   └── shared/               # types, auth helpers, event contracts shared across apps
├── docs/
│   ├── diagrams/             # c4/, sequence/, state/, journey/, deployment.md
│   ├── api/                  # OpenAPI specs (onboarding.yaml, simulation.yaml)
│   ├── specs/                # per-feature specs written before each phase
│   ├── dev-setup.md          # full local run instructions
│   └── case-study.md         # the Phase 7 write-up
├── CLAUDE.md                 # architecture decisions, tech-stack reasoning, progress log
├── BACKLOG.md                # phase-by-phase build plan and status
└── FEATURES.md               # numbered log of completed work
```

## Tech stack

Next.js (Node/TypeScript) end to end, Fastify for the microservices, Neon
Postgres + NextAuth.js for auth/profile, MongoDB Atlas for
portfolios/snapshots/insights, Upstash Redis for the event bus (Redis
Streams), caching, and rate limiting, Cloudflare R2 for exported PDF
reports, and Google Gemini for the AI-generated comparisons.

Full reasoning for each choice — including why Neon over Supabase, why
Gemini over Claude/OpenAI, and the cost-control policy for metered APIs —
is in [`CLAUDE.md`](./CLAUDE.md) under "Tech stack."

## Running it locally

Six processes (web + gateway + 4 microservices), each with its own `.env`.
Full instructions, ports, health checks, and known gotchas:
[`docs/dev-setup.md`](./docs/dev-setup.md).

Quick-start feel:

```bash
# one terminal per app, in this order
cd apps/api-gateway          && npx tsx --env-file=.env src/index.ts   # :4000
cd apps/simulation           && npx tsx --env-file=.env src/index.ts   # :4001
cd apps/market-data          && npx tsx --env-file=.env src/index.ts   # :4002
cd apps/performance-tracking && npx tsx --env-file=.env src/index.ts   # :4003
cd apps/insight-ai           && npx tsx --env-file=.env src/index.ts   # :4004
cd apps/web                  && npx next dev                           # :3000
```

## Diagrams and API specs

- [C4 context](./docs/diagrams/c4/context.md) / [container](./docs/diagrams/c4/container.md) / [component (Onboarding)](./docs/diagrams/c4/component-onboarding.md)
- Sequence diagrams: [onboarding](./docs/diagrams/sequence/onboarding.md), [scenario comparison](./docs/diagrams/sequence/scenario-compare.md), [scheduled performance snapshot](./docs/diagrams/sequence/performance-snapshot.md)
- [State diagram — portfolio lifecycle](./docs/diagrams/state/portfolio-lifecycle.md)
- [User journey — first-time user](./docs/diagrams/journey/first-time-user.md)
- [Deployment diagram](./docs/diagrams/deployment.md)
- OpenAPI specs: [Onboarding](./docs/api/onboarding.yaml), [Simulation](./docs/api/simulation.yaml)

## Status

Phases 0–6 are complete and verified live end to end: onboarding, scenario
simulation, real market data, tumbling-window performance tracking,
AI-generated comparisons with PDF export and email, the API Gateway, and
the full diagram/OpenAPI set.

Not done yet (Phase 7, "ship it"): a publicly deployed live demo and a
cleaned-up commit history — the written case study is done
([`docs/case-study.md`](./docs/case-study.md)). See
[`BACKLOG.md`](./BACKLOG.md) for the full phase-by-phase checklist,
including the separate Phase 8 Behance UX case study (independent track,
not required for this engineering write-up).
