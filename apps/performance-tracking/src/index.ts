import Fastify from "fastify";
import { snapshotRoutes } from "./routes";
import { startSnapshotWorker } from "./worker";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true }));
app.register(snapshotRoutes);

const port = Number(process.env.PORT ?? 4003);
app
  .listen({ port, host: "0.0.0.0" })
  .then(() => startSnapshotWorker())
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
