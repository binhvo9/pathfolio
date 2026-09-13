# Feature: Default Allocation Suggestion Engine

Status: Implemented & verified live
Service: User & Onboarding

## Problem / goal

Once a user has a risk_band and income_tilt_band (from `02-risk-questionnaire.md`),
the system needs to turn those into an actual number: what % of their
money goes into each of the 6 asset classes.

## Scope

In: rule-based lookup + adjustment + clamp + renormalize, producing a
final allocation %. This becomes the default allocation shown at the end
of onboarding, and later seeds the user's first scenario (Phase 2, via
the `UserOnboarded` event).

Out: letting the user manually edit the allocation (that's just editing a
Portfolio Simulation scenario, Phase 2's job, not this engine's).
ML-based allocation — explicitly rule-based first per BACKLOG.md.

## Behavior

1. Look up **base allocation** for the user's `risk_band` (fixed table,
   6 asset classes, sums to 100%):

   | Risk band | Stocks | Bonds | Cash | Crypto | Gold | Real Estate |
   |---|---|---|---|---|---|---|
   | Conservative | 20% | 50% | 20% | 0% | 5% | 5% |
   | Balanced | 40% | 30% | 10% | 5% | 5% | 10% |
   | Growth | 55% | 15% | 5% | 10% | 5% | 10% |
   | Aggressive | 60% | 5% | 5% | 20% | 5% | 5% |

2. Apply the **income tilt adjustment** for the user's `income_tilt_band`
   (percentage-point deltas added to the base):

   | Income tilt | Stocks | Bonds | Cash | Crypto | Gold | Real Estate |
   |---|---|---|---|---|---|---|
   | IncomeFocused | −10 | +10 | 0 | −5 | 0 | +5 |
   | Balanced | 0 | 0 | 0 | 0 | 0 | 0 |
   | GrowthFocused | +10 | −10 | 0 | +5 | 0 | −5 |

3. **Clamp**: any resulting value below 0 is set to 0 (no negative
   allocation).

4. **Renormalize**: if clamping changed the total away from 100%, scale
   every value proportionally (`value / sum * 100`) so the final
   allocation sums back to exactly 100%.

5. Result is stored and returned as the default allocation — the
   allocation the user sees at the end of onboarding, before they've
   created any scenario of their own.

## Data

Adds to `RiskProfile`: `default_allocation` (JSON — 6 asset class keys →
percentage), computed once when the questionnaire completes, not
recomputed unless the user redoes the questionnaire.

## API / interface

- Computed as part of `POST /api/onboarding/questionnaire`'s response
  (from `02-risk-questionnaire.md`) — no separate endpoint needed, this is
  a pure function called right after scoring, not a user-triggered action
- Emits `UserOnboarded` event (id, default_allocation) onto the event bus
  once computed — Portfolio Simulation (Phase 2) consumes this to seed
  the user's first scenario

## Open questions

None open — the base/adjustment tables are tunable constants, not
architectural decisions; safe to adjust numbers later without a spec change.
