import type { FastifyInstance } from "fastify";
import { isValidAllocation } from "@pathfolio/shared";
import { requireInternalCaller } from "@pathfolio/shared";
import { createPortfolio, listPortfolios, deletePortfolio, setStatus } from "./repository";

// OnboardingController-equivalent for this service — routes match
// docs/specs/04-portfolio-simulation.md's API section exactly.
export async function portfolioRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireInternalCaller);

  app.post<{ Body: { name: string; allocation: unknown } }>("/portfolios", async (request, reply) => {
    const { name, allocation } = request.body;
    if (!name || !isValidAllocation(allocation)) {
      return reply.code(400).send({ error: "Invalid name or allocation (must sum to 100)" });
    }
    const portfolio = await createPortfolio(request.userId, name, allocation, "manual");
    return reply.code(201).send(portfolio);
  });

  app.get("/portfolios", async (request) => {
    return listPortfolios(request.userId);
  });

  app.delete<{ Params: { id: string } }>("/portfolios/:id", async (request, reply) => {
    const ok = await deletePortfolio(request.userId, request.params.id);
    if (!ok) return reply.code(404).send({ error: "Not found" });
    return reply.code(204).send();
  });

  app.patch<{ Params: { id: string } }>("/portfolios/:id/activate", async (request, reply) => {
    const ok = await setStatus(request.userId, request.params.id, "Active");
    if (!ok) return reply.code(404).send({ error: "Not found" });
    return reply.send({ status: "Active" });
  });

  app.patch<{ Params: { id: string } }>("/portfolios/:id/archive", async (request, reply) => {
    const ok = await setStatus(request.userId, request.params.id, "Archived");
    if (!ok) return reply.code(404).send({ error: "Not found" });
    return reply.send({ status: "Archived" });
  });
}
