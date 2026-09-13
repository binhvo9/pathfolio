import type { FastifyRequest, FastifyReply } from "fastify";

// Trusted-caller pattern shared by every standalone Node service (apps/
// simulation, apps/market-data, apps/performance-tracking) — see the
// comment next to INTERNAL_API_KEY in any of their .env files for why
// this exists instead of each service verifying NextAuth sessions itself.
// Was duplicated in 2 services before this; extracted once a 3rd needed it.

function checkInternalKey(request: FastifyRequest, reply: FastifyReply): boolean {
  const key = request.headers["x-internal-api-key"];
  if (key !== process.env.INTERNAL_API_KEY) {
    reply.code(401).send({ error: "Unauthorized" });
    return false;
  }
  return true;
}

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

// User-scoped routes — apps/web forwards the real session's userId.
export async function requireInternalCaller(request: FastifyRequest, reply: FastifyReply) {
  if (!checkInternalKey(request, reply)) return;

  const userId = request.headers["x-user-id"];
  if (typeof userId !== "string" || !userId) {
    return reply.code(400).send({ error: "Missing x-user-id" });
  }

  request.userId = userId;
}

// Cross-user internal routes (e.g. Performance Tracking listing every
// user's Active portfolios) — no single userId to scope to.
export async function requireInternalKeyOnly(request: FastifyRequest, reply: FastifyReply) {
  checkInternalKey(request, reply);
}
