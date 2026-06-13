import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadConfig } from "./config.js";
import { pool } from "./database.js";
import { NotificationRepository } from "./repositories/notification.repository.js";
import { NotificationService } from "./services/notification.service.js";
import { startConsumer } from "./consumer.js";

const config = loadConfig();

const app = Fastify({
  logger: { transport: { target: "pino-pretty", options: { colorize: true } } },
});

async function start() {
  const notificationRepo = new NotificationRepository(pool);
  const notificationService = new NotificationService(notificationRepo);

  await app.register(cors, {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  });

  app.get("/health", async () => ({ status: "ok", service: "notifications" }));

  // Start RabbitMQ consumer
  await startConsumer(notificationService);

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  app.log.info(`Notifications service running on port ${config.PORT}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
