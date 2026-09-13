# Portfolio Simulation (microservice)

Create / list / delete scenario portfolios. NoSQL (flexible schema).
CAP trade-off: chooses **AP** — a stale scenario list is acceptable,
downtime is not.

Consumes: `onboarding.completed`
