# Deployment — where this actually runs

Target deployment for Phase 7 (nothing is live yet — see BACKLOG.md).
**Split across two compute platforms, not one**, because the services
have genuinely different runtime shapes:

- `apps/web` (Next.js) is stateless per-request — a natural fit for
  Vercel's serverless functions.
- The other 4 services are long-running Fastify processes
  (`app.listen()`), and `apps/performance-tracking` also runs a
  `setInterval` worker loop in the same process
  (`docs/specs/06-performance-tracking.md`). Vercel serverless functions
  are stateless and don't keep a process — or a timer — alive between
  requests, so they can't host these as-is without a rewrite (route
  handler + Vercel Cron replacing `setInterval`, deferred past Phase 7).
  **Railway** hosts them unchanged instead — it runs a real persistent
  process, same code, no rewrite.

```
                              Internet
                                  │
                                  v
                    ┌─────────────────────────┐
                    │   Vercel (apps/web)      │
                    │   Next.js, serverless    │
                    │   functions — Vercel's   │
                    │   own routing IS the      │
                    │   load balancer here,     │
                    │   nothing hand-built      │
                    └────────────┬─────────────┘
                                  │ HTTPS, internal API key +
                                  │ trusted x-user-id header
                                  │ (packages/shared/auth)
                                  v
                    ┌──────────────────────────┐
                    │  API Gateway (Railway)    │
                    │  apps/api-gateway,         │
                    │  docs/specs/08-api-        │
                    │  gateway.md — path-prefix  │
                    │  reverse proxy, one URL    │
                    │  for apps/web to know      │
                    └────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────────┐
        │                Railway (same project,                 │
        │              4 independently deployed services)       │
        │                                                        │
        │  ┌────────────┐┌───────────┐┌────────────┐┌─────────┐ │
        │  │Simulation  ││  Market   ││Performance ││Insight/ │ │
        │  │            ││   Data    ││ Tracking + ││   AI    │ │
        │  │            ││           ││   worker   ││         │ │
        │  └─────┬──────┘└─────┬─────┘└─────┬──────┘└────┬────┘ │
        │        │ Railway restarts a crashed process     │      │
        │        │ automatically (health check) — the      │      │
        │        │ same "don't hand-build infra" spirit    │      │
        │        │ as Vercel's routing above, just a        │      │
        │        │ different platform's version of it.      │      │
        └────────┼─────────────┼─────────────┼──────────────┼─────┘
                  v             v             v              v
        ┌─────────────┐┌─────────────┐┌──────────────────────┐┌───────────┐
        │  Postgres   ││Redis (cache,││  MongoDB Atlas        ││R2 Bucket  │
        │  (Neon)     ││event bus,   ││  (Portfolios, Perf.   ││(Cloudflare)│
        │             ││rate limits) ││  Snapshots, Insights) ││PDF reports │
        └─────────────┘└─────────────┘└──────────────────────┘└───────────┘

        External APIs (not hosted by us): Google/GitHub OAuth,
        Google Gemini, Finnhub + CoinGecko, Resend.
```

**The Gateway only fronts edge traffic, not the Insight/AI → Simulation /
Performance Tracking calls inside `apps/insight-ai/src/clients.ts`** —
those stay direct, service-to-service, same as a real microservice mesh
where a gateway sits at the boundary rather than in the middle of every
internal call (`docs/specs/08-api-gateway.md`'s Scope).

**Load Balancer — POC-level, not hand-built (closes out this Phase 6
item):** neither Vercel nor Railway gets a custom load balancer here.
Vercel's own edge routing fronts `apps/web`; Railway's per-service
routing + automatic health-check restarts front the 4 microservices,
called out explicitly in front of Market Data (the most-called service,
per `docs/diagrams/c4/container.md`) as the concept this project
demonstrates awareness of, without hand-rolling infrastructure a
demo-scale project doesn't need.

**Secrets stay per-service, not shared.** Each `apps/*/.env` today
becomes that service's own environment variables on its hosting
platform — `INTERNAL_API_KEY` is the one value duplicated everywhere on
purpose (the trusted-caller pattern needs every service to check the
same shared secret); everything else (DB URLs, provider API keys) is
scoped to only the service that actually calls that provider.

References: `docs/diagrams/c4/container.md`, `docs/specs/08-api-gateway.md`,
`docs/dev-setup.md`, CLAUDE.md's "Tech stack" section.
