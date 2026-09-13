# C4 Container — the PathFolio service map

```
┌───────────────────────────── Web App (Next.js) ──────────────────────────────┐
│ HTTPS · Onboarding calls stay direct (same modular monolith); every other    │
│ call goes through the API Gateway instead of 4 separate service URLs        │
└───────────────┬───────────────────────────────┬─────────────────────────────┘
                v                                v
      ┌──────────────────┐            ┌───────────────────────┐
      │ User & Onboarding │            │      API Gateway       │
      │ [monolith: auth,  │            │ [apps/api-gateway] —   │
      │  profile,         │            │ path-prefix reverse    │
      │  risk-quiz]       │            │ proxy, docs/specs/     │
      └─────────┬─────────┘            │ 08-api-gateway.md      │
                │                      └───┬─────┬─────┬─────┬──┘
                │ UserOnboarded            v     v     v     v
                │ event (Redis      ┌───────────┐┌──────────┐┌────────────┐┌──────────┐
                │ Streams, the      │ Portfolio ││  Market  ││Performance ││ Insight/ │
                │ only async pair   │Simulation ││   Data   ││ Tracking   ││    AI    │
                │ in the system)    │[microsvc] ││[microsvc]││[microsvc,  ││[microsvc]│
                │                   │           ││          ││ cron job]  ││          │
                └──────────────────>└─────┬─────┘└────┬─────┘└─────┬──────┘└─────┬────┘
                                           │            │            │             │
                                           v            v            v             v
       ┌─────────────┐    ┌─────────────┐┌────────────────────────────────┐┌───────────┐
       │  Postgres   │    │ Redis Cache ││   MongoDB Atlas — Portfolios / ││ R2 Bucket │
       │  (Neon)     │    │ (Upstash)   ││   PerformanceSnapshots /       ││(Cloudflare)│
       │ Users,      │    │ prices,     ││   Insights — 1 cluster,        ││PDF reports │
       │ RiskProfile │    │ rate limit  ││   3 collections (all 3 write)  ││(owned by   │
       └─────────────┘    └─────────────┘└────────────────────────────────┘│Insight/AI) │
                                                                              └───────────┘
```

Onboarding is the deliberate exception — a modular monolith (auth +
profile + risk-quiz), everything else is a microservice, and its calls
to Simulation/Performance Tracking/Market Data/Insight-AI go through the
**API Gateway** (new, docs/specs/08-api-gateway.md) instead of knowing
each service's own URL. Only Onboarding → Simulation is async (the
`UserOnboarded` event, via Redis Streams, bypassing the Gateway entirely
since it's not a request/response call); every other service-to-service
or Web-App-to-service call is a direct request/response. The Gateway
itself only fronts this edge traffic — Insight/AI's own calls into
Simulation and Performance Tracking (`apps/insight-ai/src/clients.ts`)
stay direct, service-to-service, same as a real microservice mesh.
Postgres is on **Neon** (with **NextAuth.js** handling OAuth, since Neon
has no built-in auth). Load Balancer is POC-level only — see
`docs/diagrams/deployment.md` for where each piece actually runs
(Vercel for Web App, Railway for the Gateway + 4 microservices) and how
load-balancing/health-check-restart is handled by each platform rather
than hand-built. External systems (Gemini, market data API, OAuth,
email) are left off this diagram — see the Context diagram.
