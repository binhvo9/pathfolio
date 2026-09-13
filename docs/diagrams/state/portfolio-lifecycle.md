# State — Portfolio lifecycle

```
                    create (onboarding-default or manual)
                                  |
                                  v
                            +-----------+
                       +--->|   Draft   |
                       |    +-----------+
                       |      |       |
                       |      |       | archive
              activate |      |       +------------------+
                       |      v                           v
                       |  +-----------+   archive   +-----------+
                       +--|  Active   |------------>| Archived  |
                          +-----------+              +-----------+

  delete: allowed from any state (Draft, Active, or Archived) -> gone.
  No transition back out of Archived — re-activating means creating a
  new scenario, not reviving an old one.
```

- **Draft** — just created, not tracked yet. A user can hold several
  drafts while deciding what to compare (docs/specs/04-portfolio-simulation.md).
- **Active** — user opted in; Performance Tracking (Phase 4) only takes
  snapshots of Active portfolios, never Draft or Archived ones.
- **Archived** — done comparing, hidden from the default dashboard list,
  data kept (not deleted).
- **Delete** is a separate action, not a state — removes the portfolio
  entirely, reachable from any of the three states.
