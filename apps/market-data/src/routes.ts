import type { FastifyInstance } from "fastify";
import { requireInternalKeyOnly } from "@pathfolio/shared";
import { getPrice, getAllPrices, ASSET_CLASSES, type LiveAssetClass } from "./prices";

function isLiveAssetClass(value: string): value is LiveAssetClass {
  return (ASSET_CLASSES as readonly string[]).includes(value);
}

export async function priceRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireInternalKeyOnly);

  app.get("/prices", async (_request, reply) => {
    try {
      return await getAllPrices();
    } catch (err) {
      return reply.code(503).send({ error: err instanceof Error ? err.message : "Upstream error" });
    }
  });

  app.get<{ Params: { assetClass: string } }>("/prices/:assetClass", async (request, reply) => {
    const { assetClass } = request.params;
    if (!isLiveAssetClass(assetClass)) {
      return reply.code(400).send({ error: `Unknown asset class: ${assetClass}` });
    }
    try {
      return await getPrice(assetClass);
    } catch (err) {
      return reply.code(503).send({ error: err instanceof Error ? err.message : "Upstream error" });
    }
  });
}
