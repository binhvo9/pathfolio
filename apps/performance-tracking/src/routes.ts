import type { FastifyInstance } from "fastify";
import { requireInternalCaller } from "@pathfolio/shared";
import { snapshots } from "./db";

// For the performance history view UI — docs/specs/06-performance-tracking.md.
export async function snapshotRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireInternalCaller);

  app.get<{ Params: { id: string } }>("/portfolios/:id/snapshots", async (request) => {
    // Scoped by both portfolioId and userId — defense in depth, same as
    // apps/simulation's repository (NFR-SEC-1), even though apps/web
    // already only shows users their own portfolio ids.
    return snapshots
      .find({ portfolioId: request.params.id, userId: request.userId })
      .sort({ takenAt: 1 })
      .toArray();
  });
}
