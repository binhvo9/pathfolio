# PathFolio — Simple Investing Guidance for Beginners (UX Case Study)

**Role:** Solo product designer
**Tools:** Figma Pro + Claude (Figma MCP)
**Scope:** 6 screens, 1 wired prototype, built alongside the real coded product

Figma file: https://www.figma.com/design/uai3qul7EejytWFnnXvfN0
Clickable prototype: https://www.figma.com/proto/uai3qul7EejytWFnnXvfN0?node-id=8-4

---

## The problem

Beginner, middle/lower-income New Zealanders who want to start investing
are stuck between two bad options: generic advice ("just buy an index
fund") that ignores their actual goal and timeline, or a real advisory
platform that assumes they already understand risk tolerance, asset
allocation, and rebalancing. They don't need more information — they
need a guided decision, explained in plain language, that they can
compare against alternatives before committing any real money.

## Meet the user

**Chloe Ngata**, 27, Hamilton. Dental nurse, ~$58k/year, $6,000 sitting
in an everyday bank account earning next to nothing. She's tried a
robo-advisor app before and bounced off it because it wanted her real
bank linked before it would show her anything useful. What she actually
needs: to see one suggested option, understand *why* it fits her, and
be able to compare it against something else before she trusts it with
real decisions.

## The north star

Every screen in this flow answers one question for Chloe: **"is this
scenario actually right for my goal, and why?"** — not just numbers on
a page, but a plain-language answer she can act on. The onboarding
result screen answers it once with a rule-based allocation; the compare
screen answers it again, this time backed by real performance history
and an AI-generated explanation.

## The process

Research → user flow → wireframes → hi-fi mockups → prototype, restaging
a flow that already exists in a real, working product (not a from-scratch
concept) rather than reverse-engineering one:

1. **Research.** Problem statement, persona, and a user-flow map, scoped
   to what a real first-time user does today: sign in, answer 4
   onboarding questions, land on a suggested allocation, create a second
   scenario, compare the two. Empathy mapping, formal competitive
   analysis, and usability testing were deliberately left out — there's
   no real user pool to test against on a solo project, and faking that
   research would be worse than skipping it.
2. **Wireframes.** First pass was built at a 320px mobile-app frame
   size — a mistake, caught on review: this is a web app, not a mobile
   one. Rebuilt at desktop web sizes with the real product's actual
   layout constraints (a centered ~640px content column) as the
   baseline.
3. **Hi-fi mockups.** The wireframe pass, once corrected for platform,
   still looked thin — a narrow column of content floating in a lot of
   dead space on a wide canvas. Fixed with a proper app shell: a
   persistent left sidebar (logo, nav, account) on every post-auth
   screen, plus real visual weight — shadows, a gradient hero on sign-in,
   color-coded allocation bars, a gradient-fill comparison chart with a
   highlighted endpoint.
4. **Prototype.** 12 click targets wired end to end: sign in → both
   onboarding screens → dashboard, then dashboard, "new scenario," and
   "compare" all cross-linked through both their primary buttons and the
   sidebar nav — so the whole loop (not just one linear path) is
   actually clickable.

## A deliberate color choice

The default direction (a forest-green accent) turned out to closely
match the palette of another case study in this same portfolio
(*Fortress — Wealth & Rental Portfolio App*). Two projects sitting
side by side shouldn't read as reskins of each other, so PathFolio's
identity moved to a distinct blue — confident and calm, appropriate for
a beginner-facing financial tool, and visually its own thing next to
Fortress's forest-green-and-gold.

## Key screens

**Sign in** — a single decision (Google or GitHub), framed with a soft
gradient background rather than a bare form, so the very first screen
doesn't feel like a wall.

**Onboarding — question** — one question at a time, a visible progress
indicator, plain-language options ("Sell everything" / "Do nothing" /
"Buy more") instead of finance jargon like "risk tolerance."

**Onboarding — result** — the payoff screen: a real suggested
allocation across six asset classes, color-coded, with the reasoning
("Balanced risk tolerance and Balanced income preference") stated
plainly above the numbers.

**Dashboard** — every scenario Chloe has, with its own status and
today's change, plus a direct path to create another one — the moment
core value prop #3 (comparing multiple scenarios) becomes something she
can actually do, not just a feature description.

**New scenario** — a constrained form: six percentages that must sum to
100, validated live, so it's impossible to submit something the product
can't act on.

**Compare** — the payoff of the whole flow: both scenarios' value curves
on one chart, and a plain-language verdict on which one actually fits
her stated goal, generated from her real data.

## Outcome

A 6-screen, fully clicked-through prototype of PathFolio's real core
loop — publicly viewable, no login required. It restages an actual
shipped product's flow rather than a concept, corrected two real
mistakes along the way (wrong platform size, then dead whitespace) by
checking against the real thing instead of assuming the first pass was
right, and gave the project a visual identity distinct from other work
in the same portfolio.

---

Engineering write-up for the same product (system design, architecture
trade-offs, not UX): [`docs/case-study.md`](../case-study.md).
