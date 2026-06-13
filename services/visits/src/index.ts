import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadConfig } from "./config.js";
import { pool } from "./database.js";
import { VisitRepository } from "./repositories/visit.repository.js";
import { VisitService } from "./services/visit.service.js";
import { createVisitRoutes } from "./routes/visit.routes.js";

const config = loadConfig();

const app = Fastify({
  logger: { transport: { target: "pino-pretty", options: { colorize: true } } },
});

async function start() {
  const visitRepo = new VisitRepository(pool);
  const visitService = new VisitService(visitRepo);

  await app.register(cors, {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  });

  await app.register(createVisitRoutes(visitService), { prefix: "/api/v1/visits" });

  app.get("/health", async () => ({ status: "ok", service: "visits" }));

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  app.log.info(`Visits service running on port ${config.PORT}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
