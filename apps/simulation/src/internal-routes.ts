import type { FastifyInstance } from "fastify";
import { requireInternalKeyOnly } from "@pathfolio/shared";
import { listAllActivePortfolios } from "./repository";

// Cross-user routes, only for other internal services — never proxied
// through apps/web the way /portfolios/* is. docs/specs/06-performance-tracking.md.
export async function internalRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireInternalKeyOnly);

  app.get("/internal/active-portfolios", async () => listAllActivePortfolios());
}
