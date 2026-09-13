import { Redis } from "@upstash/redis";
import { Ratelimit, type Duration } from "@upstash/ratelimit";

// Guardrails on metered external calls (Gemini, R2, Resend) —
// REQUIREMENTS.md's NFR-COST-2, CLAUDE.md's 2026-09-12 "cost guardrails"
// entry. Same @upstash/ratelimit pattern as apps/market-data's
// provider-fetch limiter.
//
// TWO layers, not one: a per-user limit alone doesn't protect an
// account-wide quota — Resend's free tier is 100 emails/DAY for the
// whole account, not per user, so N users each under their own limit
// could still blow through it together. Every checkAllowed() call checks
// both; either tripping blocks the request.

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const GLOBAL_KEY = "global";

function makeLimiterPair(name: string, perUserLimit: [number, Duration], globalLimit: [number, Duration]) {
  const perUser = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(...perUserLimit),
    prefix: `insight-ai:ratelimit:${name}:user`,
  });
  const global = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(...globalLimit),
    prefix: `insight-ai:ratelimit:${name}:global`,
  });

  return {
    async checkAllowed(userId: string): Promise<boolean> {
      // Check both — Promise.all so a fast global check doesn't wait on a
      // slow per-user one or vice versa; either failing blocks the call.
      const [userResult, globalResult] = await Promise.all([perUser.limit(userId), global.limit(GLOBAL_KEY)]);
      return userResult.success && globalResult.success;
    },
  };
}

// Gemini: real free-tier RPD is reported anywhere from 500-1500
// depending on source/model — 100/day global is ≤20% of even the lowest
// figure. Also worth knowing: exceeding this tier just gets a 429, no
// card on file, no possibility of an actual bill.
export const geminiLimiter = makeLimiterPair("compare", [10, "1 h"], [100, "1 d"]);

// R2 free tier: 1M Class A (write) ops/month, 10GB storage. 100/day here
// is ~3,000/month — 0.3% of the real cap.
export const exportLimiter = makeLimiterPair("export", [10, "1 h"], [100, "1 d"]);

// Resend free tier: 100 emails/DAY for the WHOLE account (verified via
// resend.com/blog/new-free-tier) — the tightest real cap of the three,
// and the only one with genuine billing risk attached. Global cap set at
// 50/day, exactly half, not shaved close to the edge.
export const emailLimiter = makeLimiterPair("email", [5, "1 h"], [50, "1 d"]);
