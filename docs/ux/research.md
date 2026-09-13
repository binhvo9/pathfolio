# PathFolio — UX Research (Phase 8)

For the Behance case study — separate audience from the engineering
write-up (`docs/case-study.md`). Scope modeled loosely after
[Donor Hub's Behance case study](https://www.behance.net/gallery/253760559/Donor-Hub-Blood-Donation-Mobile-App-UX-Case-Study),
simplified per CLAUDE.md's Phase 8 note ("simpler scope is fine, same
idea"): problem statement → persona → user flow → wireframes → hi-fi →
prototype → write-up. Skipped on purpose: empathy mapping, formal
competitive analysis, and usability testing sessions — there's no real
user pool to test against for a solo demo project, and those sections
would be fabricated rather than grounded.

Featured flow (user-approved 2026-09-13): **Onboarding → Dashboard →
Compare** — the full first-time journey, not just one screen, matching
`docs/diagrams/journey/first-time-user.md`.

## Problem statement

Beginner, middle/lower-income New Zealanders who want to start investing
are stuck between two bad options: generic advice ("just buy an index
fund") that ignores their actual goal and timeline, or a real advisory
platform that assumes they already understand risk tolerance, asset
allocation, and rebalancing. They don't need more information — they
need a guided decision, explained in plain language, that they can
compare against alternatives before committing.

## Persona

**Chloe Ngata**, 27, Hamilton. Works full-time as a dental nurse, takes
home roughly $58k/year. Has $6,000 in savings sitting in a everyday
bank account earning close to nothing, because she's "meant to start
investing" but every article she reads assumes she already knows what
an ETF or an asset allocation is.

- **Goal:** save toward a house deposit in the next 5-7 years, but
  isn't fully certain — general growth is also fine if a deposit feels
  too far off (maps to PathFolio's `GENERAL_GROWTH`/`HOUSE_DEPOSIT`
  goal options)
- **Risk attitude:** would probably sell some of a portfolio if it
  dropped 20% in a month, but wouldn't panic-sell everything — not
  aggressive, not overly cautious either
- **Frustrations:** finance content is either too basic ("just save
  more") or too jargon-heavy (assumes she knows what "rebalancing"
  means); she's tried a robo-advisor app before and bounced off it
  because it asked for real bank linkage before showing her anything
  useful
- **What would make her trust a tool:** seeing an actual suggested
  allocation with a plain-language reason attached to it, before being
  asked to commit anything real; being able to try more than one option
  side by side rather than being told there's only one right answer

## User flow (this case study's scope)

Sign in → answer 4 onboarding questions → see suggested allocation →
land on dashboard → create a second scenario to compare against the
default → select both → view the comparison (chart + plain-language
explanation of which one fits her goal better).

Full technical/behavioral detail already exists in
`docs/diagrams/journey/first-time-user.md` (all 12 steps, engineering
framing) and `docs/diagrams/wireframes/onboarding-flow.md` (the
low-fi ASCII version of the onboarding screens) — this case study
restages that same real, already-built flow visually in Figma rather
than inventing a new one, and covers screens 2 (sign in) through the
comparison result.

## Screens in scope for wireframe → hi-fi → prototype

1. Sign in
2. Onboarding — goal question (representative of the 4-question set)
3. Onboarding — result (suggested allocation)
4. Dashboard (portfolio list + "+ New scenario")
5. New scenario form
6. Compare (chart + AI insight)

Grounded in the real, currently-built UI (`apps/web/src/app/dashboard/page.tsx`,
`apps/web/src/app/compare/page.tsx`) rather than a from-scratch
redesign — the point of this case study is presenting the real product
well, not designing a hypothetical one.
