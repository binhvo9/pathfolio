import type { FastifyInstance } from "fastify";
import { requireInternalCaller } from "@pathfolio/shared";
import { compareScenarios } from "./compare";
import { exportPortfolioReport, PortfolioNotFoundError } from "./export";
import { fetchRiskProfile } from "./clients";
import { sendReportEmail } from "./email";
import { geminiLimiter, exportLimiter, emailLimiter } from "./ratelimit";

export async function insightRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireInternalCaller);

  app.post<{ Body: { portfolioIds: string[] } }>("/compare", async (request, reply) => {
    const { portfolioIds } = request.body;
    if (!Array.isArray(portfolioIds) || portfolioIds.length < 2) {
      return reply.code(400).send({ error: "portfolioIds must have at least 2 entries" });
    }

    // NFR-COST-2 — per-user AND account-wide caps on triggering Gemini.
    const allowed = await geminiLimiter.checkAllowed(request.userId);
    if (!allowed) {
      return reply.code(429).send({ error: "Too many comparisons — try again in a bit" });
    }

    const insightText = await compareScenarios(request.userId, portfolioIds);
    return { insightText };
  });

  app.post<{ Params: { id: string } }>("/portfolios/:id/export", async (request, reply) => {
    const allowed = await exportLimiter.checkAllowed(request.userId);
    if (!allowed) {
      return reply.code(429).send({ error: "Too many exports — try again in a bit" });
    }

    try {
      const { url } = await exportPortfolioReport(request.userId, request.params.id);
      return { url };
    } catch (err) {
      if (err instanceof PortfolioNotFoundError) {
        return reply.code(404).send({ error: "Portfolio not found" });
      }
      throw err;
    }
  });

  app.post<{ Params: { id: string } }>("/portfolios/:id/email", async (request, reply) => {
    const allowed = await emailLimiter.checkAllowed(request.userId);
    if (!allowed) {
      return reply.code(429).send({ error: "Too many emails — try again in a bit" });
    }

    const riskProfile = await fetchRiskProfile(request.userId);
    if (!riskProfile?.email) {
      return reply.code(400).send({ error: "No email on file for this user" });
    }

    try {
      const { url, portfolioName } = await exportPortfolioReport(request.userId, request.params.id);
      await sendReportEmail(riskProfile.email, portfolioName, url);
      return { sent: true };
    } catch (err) {
      if (err instanceof PortfolioNotFoundError) {
        return reply.code(404).send({ error: "Portfolio not found" });
      }
      throw err;
    }
  });
}
