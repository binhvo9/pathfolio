# User journey — beginner's first-time experience

A beginner, lower/middle-income NZ retail investor's actual path through
the app today, start to finish. Unlike the wireframe (screen-by-screen
UI) or the sequence diagrams (technical request/response), this traces
*decisions and motivation* — what the user is trying to do and why they
move to the next step.

```
┌─────────────────┐     ┌──────────────────────┐     ┌───────────────────────┐
│ 1. Land on the   │     │ 2. Sign in           │     │ 3. Onboarding          │
│    app            │────>│   (Google/GitHub)     │────>│    questionnaire       │
│                   │     │                       │     │   (4 questions,        │
│ Motivation:       │     │ No password to        │     │    beginner wording,   │
│ "I want to invest │     │ remember — lowers      │     │    docs/diagrams/      │
│ but don't know     │     │ the barrier for a     │     │    wireframes/         │
│ where to start."   │     │ non-technical user.   │     │    onboarding-flow.md) │
└─────────────────┘     └──────────────────────┘     └───────────┬───────────┘
                                                                    │
                                                                    v
┌───────────────────────┐     ┌───────────────────────────────────────────┐
│ 5. Dashboard           │<────│ 4. See default allocation                 │
│                        │     │                                            │
│ "My First Portfolio"   │     │ Motivation: "Does this actually make      │
│ auto-created (Draft),  │     │ sense for MY goal?" — seeing real %s      │
│ from the questionnaire │     │ against plain-language reasoning builds   │
│ result.                │     │ trust before any money (simulated) is at  │
└──────────┬─────────────┘     │ stake.                                    │
           │                   └───────────────────────────────────────────┘
           v
┌─────────────────────────┐
│ 6. Activate it           │
│                          │
│ Motivation: "OK, I'm     │
│ ready to actually track  │
│ this one." Draft ->      │
│ Active (docs/diagrams/   │
│ state/portfolio-         │
│ lifecycle.md)            │
└──────────┬───────────────┘
           │
           v
┌──────────────────────────────────────────────┐
│ 7. Time passes (snapshot worker runs          │
│    automatically — no user action)            │
│                                                 │
│ Motivation: none needed — this is the one      │
│ step in the whole journey where the user       │
│ isn't doing anything at all. Value history     │
│ quietly accumulates in the background.         │
└──────────────────────┬─────────────────────────┘
                        │
                        v
┌───────────────────────────────┐     ┌──────────────────────────────────┐
│ 8. "What if I'd chosen         │────>│ 9. + New scenario                 │
│    differently?"                │     │                                    │
│                                 │     │ Name + allocation, must sum to    │
│ Motivation: curiosity/doubt —   │     │ 100%. Second scenario appears as  │
│ the moment core value prop #3   │     │ Draft (2026-09-13 fix — this path │
│ (compare scenarios) becomes      │     │ didn't exist before; see          │
│ relevant to a real user.        │     │ FEATURES.md #74).                  │
└───────────────────────────────┘     └──────────────┬─────────────────────┘
                                                        │
                                                        v
┌────────────────────────────────────────────┐     ┌──────────────────────────┐
│ 11. Read the AI comparison                   │<────│ 10. Select 2+, click     │
│                                               │     │     "Compare"             │
│ Motivation: "Which one is actually better    │     │                          │
│ for MY goal, and why?" — the plain-language   │     │ docs/diagrams/sequence/  │
│ Gemini insight (not just raw numbers) is what │     │ scenario-compare.md      │
│ answers this, per core value prop #5.         │     └──────────────────────────┘
└──────────────────┬────────────────────────────┘
                    v
┌────────────────────────────────────────────┐
│ 12. Export or email a PDF report             │
│                                               │
│ Motivation: "I want to keep/share this,      │
│ not just look at it once." Snapshot of        │
│ current state — allocation + reasoning         │
│ (early) or chart + insight (once snapshots     │
│ exist). docs/specs/07-insight-ai.md.           │
└────────────────────────────────────────────┘
                    │
                    v
        loop back to 7 — the user returns periodically to
        check performance, add more scenarios, or re-compare
        as their real understanding of their own goal sharpens.
```

**One deliberate non-step:** there's no "edit an existing scenario's
allocation" — `docs/specs/04-portfolio-simulation.md`'s Scope explicitly
excludes it. A user who wants to change a mix creates a new scenario and
compares, rather than mutating one in place — this keeps every scenario
a stable point of comparison instead of a moving target.

References: `docs/diagrams/wireframes/onboarding-flow.md` (step 3 detail),
`docs/diagrams/state/portfolio-lifecycle.md` (step 6 detail),
`docs/diagrams/sequence/scenario-compare.md` (steps 10-11 detail),
`docs/specs/07-insight-ai.md` (step 12 detail).
