# Sequence — scheduled performance snapshot (tumbling window)

```
 Worker          Simulation        Market Data       Mongo (snapshots)
   |                  |                  |                   |
   | every             |                  |                   |
   | SNAPSHOT_INTERVAL |                  |                   |
   | (timer fires,     |                  |                   |
   |  no user request) |                  |                   |
   |                  |                  |                   |
   |--GET /internal/->|                  |                   |
   |  active-portfolios|                  |                   |
   |<--[Portfolio...]--|                  |                   |
   |                  |                  |                   |
   |--GET /prices------------------------>|                   |
   |  (cache hit if <5min old,            |                   |
   |   else real Finnhub/CoinGecko call)  |                   |
   |<--{stocks, bonds, gold, crypto, cash}-|                   |
   |                  |                  |                   |
   | for each Active portfolio:          |                   |
   |   find latest snapshot -------------------------------->|
   |<---------------------------------------------------------|
   |   compute weightedChangePercent      |                   |
   |   (allocation % × each class's       |                   |
   |    changePercent; Real Estate uses   |                   |
   |    a flat rate, not a Market Data    |                   |
   |    price)                            |                   |
   |   value = prevValue × (1 + Δ%)       |                   |
   |   (or $10,000 if first snapshot)     |                   |
   |   insert new snapshot ---------------------------------->|
   |                  |                  |                   |
```

**No user in this diagram at all** — that's the point. This is the
"scheduled" counterpart to `onboarding.md`'s user-driven flow: the timer
is the trigger, not a request. Compare against `onboarding.md` for the
one place in the system that *is* event-driven (`UserOnboarded`) — this
one isn't async-messaging-driven, it's just a plain scheduled job that
happens to call two other services synchronously each time it runs.

References: `docs/specs/06-performance-tracking.md`,
`docs/diagrams/c4/container.md`.
