import Fastify from "fastify";
import { portfolioRoutes } from "./routes";
import { internalRoutes } from "./internal-routes";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true }));
app.register(portfolioRoutes);
app.register(internalRoutes);

const port = Number(process.env.PORT ?? 4001);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
