# Feature: API Gateway

Status: Implemented & verified live
Service: API Gateway (new, `apps/api-gateway`)

## Problem / goal

`apps/web` had to know 4 different backend URLs (Simulation, Market
Data, Performance Tracking, Insight/AI) and their auth headers
individually. That's fine at 4 services but doesn't scale, and it means
the frontend is coupled to exactly how many backend services exist and
where each one lives. This service exists to demonstrate the API
Gateway pattern — a single ingress that only makes sense because
Simulation/Market Data/Performance Tracking/Insight-AI are real
separate deployables (BACKLOG.md Phase 6), unlike a monolith reference
architecture.

## Scope

In: path-prefix-based reverse proxying for the 4 microservices, a
single URL for `apps/web` to call instead of 4.

Out: auth/authorization logic (each downstream service still verifies
`x-internal-api-key`/`x-user-id` itself — the gateway is a pure router,
it doesn't inspect or enforce those), rate limiting (already handled
per-service where it matters, e.g. `apps/insight-ai/src/ratelimit.ts`),
service-to-service calls (Insight/AI calling Simulation/Performance
Tracking directly, `apps/insight-ai/src/clients.ts`) — a gateway fronts
client-facing edge traffic, not internal service-to-service chatter,
same as a real microservice mesh.

## Behavior

1. `apps/web` sends every backend request to one `GATEWAY_URL` instead
   of 4 separate `*_SERVICE_URL`s, with the same trusted-caller headers
   as before (`x-internal-api-key`, `x-user-id`) — unchanged from the
   caller's point of view except the host.
2. The gateway matches the request path's prefix (`/simulation`,
   `/market-data`, `/performance`, `/insight`) and forwards it — method,
   headers, and body verbatim, prefix stripped — to that service's own
   URL, using `@fastify/http-proxy` (a real reverse-proxy plugin, not a
   hand-rolled one — proxying request bodies/streaming correctly is
   exactly the kind of thing worth using a maintained library for).
3. The downstream service's response (status, headers, body) is
   returned to the caller unchanged.
4. Auth failures behave exactly as before: the gateway doesn't 401
   anything itself, it just forwards to whichever service will 401 (or
   400/404/etc.) on its own terms.

## Data

None — no state of its own, purely a router.

## API / interface

- `GET /health` — its own liveness check, same shape as the other 4
  services
- `/simulation/*` → `SIMULATION_SERVICE_URL`
- `/market-data/*` → `MARKET_DATA_SERVICE_URL`
- `/performance/*` → `PERFORMANCE_SERVICE_URL`
- `/insight/*` → `INSIGHT_SERVICE_URL`

`apps/web`'s 4 client files (`src/lib/*-client.ts`) were updated to
build their base URL from `${GATEWAY_URL}/<prefix>` instead of a
per-service `*_SERVICE_URL` env var — those 4 env vars were removed
from `apps/web/.env` (they still exist in `apps/insight-ai/.env`,
unrelated: that's Insight/AI's own service-to-service calls, out of
this gateway's scope per the Scope section above).

## Open questions

None open. Deployment target decided alongside `docs/diagrams/
deployment.md`: Railway, same as the 4 services it fronts (it's another
long-running process, not a fit for Vercel serverless either).
