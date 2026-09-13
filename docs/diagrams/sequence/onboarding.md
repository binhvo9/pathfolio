# Sequence — user completes onboarding

```
 User          Web App         Onboarding        Postgres       Event Bus      Simulation
  |               |                 |                |               |               |
  |--Sign in----->|                 |                |               |               |
  |               |--OAuth-------->|                |               |               |
  |               |            (find/create User,   |               |               |
  |               |             empty RiskProfile)-->|               |               |
  |               |<--session------|                |               |               |
  |               |                 |                |               |               |
  |--answers 4Q-->|                 |                |               |               |
  |               |--submit------->|                |               |               |
  |               |            score risk_band +     |               |               |
  |               |            income_tilt_band      |               |               |
  |               |            (spec 02, in-process)  |               |               |
  |               |            compute default_       |               |               |
  |               |            allocation (spec 03)   |               |               |
  |               |                 |--save RiskProfile------------->|               |
  |               |                 |<--ok-----------|               |               |
  |               |                 |--publish UserOnboarded------------------------>|
  |               |                 |                |               |--consume----->|
  |               |                 |                |               |          create 1st
  |               |                 |                |               |          scenario from
  |               |                 |                |               |          default_allocation
  |               |<--default_allocation-------------|               |               |
  |<--show result screen (7)-------|                |               |               |
```

**Async boundary:** everything from "publish UserOnboarded" onward is
fire-and-forget. Onboarding replies to the user immediately with
`default_allocation` — it does not wait for Simulation to finish creating
the scenario. Simulation copies the `default_allocation` payload verbatim
into a new Portfolio row (name: "My First Portfolio", status: Draft, per
`FR-SIM-4`'s lifecycle) — no recalculation, just persisting the starting point.

References: `docs/specs/01-auth-user-schema.md`, `02-risk-questionnaire.md`,
`03-allocation-engine.md`, `docs/diagrams/wireframes/onboarding-flow.md`.
