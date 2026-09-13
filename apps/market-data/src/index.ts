import Fastify from "fastify";
import { priceRoutes } from "./routes";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true }));
app.register(priceRoutes);

const port = Number(process.env.PORT ?? 4002);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
