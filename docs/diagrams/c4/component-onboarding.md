# C4 Component — inside the User & Onboarding monolith

```
┌────────────────── User & Onboarding (modular monolith) ──────────────────┐
│                                                                            │
│ ┌──────────────┐  ┌────────────────┐  ┌─────────────────────┐           │
│ │AuthController│  │ProfileController│  │ OnboardingController │           │
│ │(NextAuth     │  │GET/PATCH        │  │POST/GET              │           │
│ │ routes)      │  │/api/profile     │  │/api/onboarding/*     │           │
│ └──────┬───────┘  └───────┬────────┘  └──────────┬───────────┘           │
│        │                   │                       │                      │
│        v                   │                       v                      │
│ ┌──────────────┐           │            ┌───────────────────────┐        │
│ │ AuthModule    │           │            │ RiskScoringModule      │        │
│ │(session,      │           │            │ (spec 02: risk_score,  │        │
│ │ NextAuth      │           │            │  income_tilt_score)    │        │
│ │ adapter)      │           │            └───────────┬────────────┘        │
│ └──────┬───────┘           │                        │                     │
│        │                   │                        v                     │
│        │                   │            ┌───────────────────────┐        │
│        │                   │            │ AllocationEngineModule │        │
│        │                   │            │ (spec 03: base table + │        │
│        │                   │            │  tilt + clamp +        │        │
│        │                   │            │  renormalize)          │        │
│        │                   │            └───────────┬────────────┘        │
│        │                   │                        │                     │
│        v                   v                        v                     │
│ ┌──────────────┐  ┌────────────────┐      ┌───────────────────┐          │
│ │UserRepository │  │RiskProfile     │      │  EventPublisher    │          │
│ │               │  │Repository      │      │ (UserOnboarded →   │          │
│ │               │  │                │      │  Redis Streams)    │          │
│ └──────┬───────┘  └───────┬────────┘      └──────────┬─────────┘          │
└────────┼───────────────────┼──────────────────────────┼────────────────────┘
         v                   v                          v
   ┌─────────────────────────────────┐            ┌─────────────┐
   │  Neon Postgres (Users,          │            │ Event Bus    │
   │  RiskProfile)                   │            │ (Redis       │
   └─────────────────────────────────┘            │  Streams)    │
                                                     └─────────────┘
```

Three controllers (API layer) call down into their own logic module
(Auth / RiskScoring / AllocationEngine), which call a repository to
persist to Neon Postgres. Only `OnboardingController`'s flow also calls
`EventPublisher` to emit `UserOnboarded` — matching
`docs/diagrams/sequence/onboarding.md`.
