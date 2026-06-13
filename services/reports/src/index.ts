import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadConfig } from "./config.js";
import { createDashboardRoutes } from "./routes/dashboard.routes.js";

const config = loadConfig();

const app = Fastify({
  logger: { transport: { target: "pino-pretty", options: { colorize: true } } },
});

async function start() {
  await app.register(cors, {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  });

  await app.register(createDashboardRoutes(), { prefix: "/api/v1/reports" });

  app.get("/health", async () => ({ status: "ok", service: "reports" }));

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  app.log.info(`Reports service running on port ${config.PORT}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
