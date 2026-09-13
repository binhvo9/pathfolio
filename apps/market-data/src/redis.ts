import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Gates calls to the external providers specifically (not every incoming
// request — the cache already absorbs most of that). Keyed per-provider
// so a burst of concurrent cache misses can't blow through either
// provider's own rate limit. FR-MKT-3.
export const providerRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  prefix: "market-data:ratelimit",
});
