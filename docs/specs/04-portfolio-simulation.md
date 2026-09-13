# Feature: Portfolio Simulation Service

Status: Implemented & verified live
Service: Portfolio Simulation

## Problem / goal

A user needs to hold multiple named "scenario" portfolios (different
allocations) so they can compare them against each other — core value
prop #3 in CLAUDE.md. This service owns that data and its lifecycle.

## Scope

In: create/list/delete scenarios, the Draft → Active → Archived lifecycle,
seeding the first scenario from Onboarding's `UserOnboarded` event.

Out: editing an existing scenario's allocation after creation (no FR
covers this — REQUIREMENTS.md only lists create/list/delete), performance
tracking and comparison (Phase 4/5's job, this service only owns the
scenario's shape, not its history).

## Behavior

**Seeding (async, event-driven):** Simulation consumes `UserOnboarded`
from the event bus (Redis Streams — replaces the EventPublisher stub from
`03-allocation-engine.md` now that this service exists to consume it).
Creates one Portfolio: name "My First Portfolio", allocation = the
event's `defaultAllocation`, status `Draft`, source `onboarding-default`.

**Manual scenario creation (sync):** user provides a name and an
allocation (6 asset classes, must sum to 100 ± rounding tolerance —
rejected otherwise). Created as `Draft`, source `manual`.

**Lifecycle — Draft → Active → Archived:**
- `Draft`: just created, not yet being tracked. A user can have several
  drafts while deciding what to compare.
- `Active`: user explicitly activates a draft once they want Performance
  Tracking (Phase 4) to start taking snapshots of it. Only Active
  portfolios get tracked — avoids wasting snapshot jobs on abandoned drafts.
- `Archived`: user is done comparing it; hidden from the default dashboard
  list but not deleted. Reachable from either Draft or Active.

**List / delete:** standard, scoped to the authenticated user only
(NFR-SEC-1 — no cross-user reads). Deleting removes the portfolio and
its allocation; does not touch PerformanceSnapshots (Phase 4 decides its
own retention).

## Data

`Portfolios` collection (MongoDB Atlas, per CLAUDE.md's storage split —
flexible schema, not ACID-critical like Users):
- `id`, `userId`, `name`
- `allocation` (6 asset class keys → percentage, same shape as
  `docs/specs/03-allocation-engine.md`'s `defaultAllocation`)
- `status` (`Draft` | `Active` | `Archived`)
- `source` (`onboarding-default` | `manual`)
- `createdAt`, `updatedAt`

## API / interface

- `POST /api/simulation/portfolios` — create `{ name, allocation }`
- `GET /api/simulation/portfolios` — list current user's portfolios
- `DELETE /api/simulation/portfolios/:id`
- `PATCH /api/simulation/portfolios/:id/activate` — Draft → Active
- `PATCH /api/simulation/portfolios/:id/archive` — Draft or Active → Archived
- Consumes `UserOnboarded` from the event bus — no HTTP endpoint, triggered
  by the bus per `docs/diagrams/sequence/onboarding.md`

## Open questions

None open — no cap on scenarios per user for MVP; revisit if abuse becomes
a real concern (not likely at demo scale).
