import Fastify from "fastify";
import httpProxy from "@fastify/http-proxy";

// Single ingress for apps/web — the pattern only makes sense because
// Simulation/Market Data/Performance Tracking/Insight-AI are real
// separate deployables (docs/specs/08-api-gateway.md). Scoped to the
// edge only: service-to-service calls (e.g. Insight/AI reading
// Simulation/Performance Tracking directly) bypass this gateway on
// purpose, same as any real microservice mesh — a gateway fronts
// client-facing traffic, not internal chatter.

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true }));

const ROUTES: { prefix: string; upstream: string }[] = [
  { prefix: "/simulation", upstream: process.env.SIMULATION_SERVICE_URL! },
  { prefix: "/market-data", upstream: process.env.MARKET_DATA_SERVICE_URL! },
  { prefix: "/performance", upstream: process.env.PERFORMANCE_SERVICE_URL! },
  { prefix: "/insight", upstream: process.env.INSIGHT_SERVICE_URL! },
];

for (const { prefix, upstream } of ROUTES) {
  app.register(httpProxy, { prefix, upstream, rewritePrefix: "" });
}

const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
