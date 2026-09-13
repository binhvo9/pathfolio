import { Redis } from "@upstash/redis";
import { USER_ONBOARDED_STREAM, type UserOnboardedEvent } from "@pathfolio/shared";

// EventPublisher (docs/diagrams/c4/component-onboarding.md) — publishes
// UserOnboarded onto the event bus (Redis Streams / Upstash) for
// Portfolio Simulation to consume, per docs/diagrams/sequence/onboarding.md.
//
// Upstash is REST-based (no persistent connection), so the consumer side
// (apps/simulation) can't do a blocking XREAD — it polls XREADGROUP
// instead. That's a Simulation-side concern; this module only XADDs.

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function publishUserOnboarded(event: UserOnboardedEvent): Promise<void> {
  await redis.xadd(USER_ONBOARDED_STREAM, "*", { payload: JSON.stringify(event) });
}
