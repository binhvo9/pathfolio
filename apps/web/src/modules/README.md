# User & Onboarding (modular monolith)

Auth + profile + risk questionnaire live together — always used in the same
flow, so no network hop between them. Postgres, ACID, source of truth.

Publishes: `UserOnboarded` (carries the default_allocation from
docs/specs/03-allocation-engine.md) — see docs/diagrams/c4/component-onboarding.md
for how auth/profile/onboarding map to code in this app.
