# Performance Tracking (microservice)

Scheduled job that computes a **tumbling window** snapshot per scenario
portfolio (daily or weekly). Writes PerformanceSnapshots to NoSQL.

Publishes: `snapshot.created`
