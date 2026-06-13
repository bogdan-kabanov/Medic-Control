import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadConfig } from "./config.js";
import { pool } from "./database.js";
import { ReminderRepository } from "./repositories/reminder.repository.js";
import { StatusLogRepository } from "./repositories/status-log.repository.js";
import { InventoryRepository } from "./repositories/inventory.repository.js";
import { ReminderService } from "./services/reminder.service.js";
import { InventoryService } from "./services/inventory.service.js";
import { createReminderRoutes } from "./routes/reminder.routes.js";
import { createInventoryRoutes } from "./routes/inventory.routes.js";
import { startMissedChecker } from "./scheduler.js";

const config = loadConfig();

const app = Fastify({
  logger: { transport: { target: "pino-pretty", options: { colorize: true } } },
});

async function start() {
  const reminderRepo = new ReminderRepository(pool);
  const statusLogRepo = new StatusLogRepository(pool);
  const inventoryRepo = new InventoryRepository(pool);

  const reminderService = new ReminderService(reminderRepo, statusLogRepo, config);
  const inventoryService = new InventoryService(inventoryRepo);

  await app.register(cors, {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  });

  await app.register(createReminderRoutes(reminderService), { prefix: "/api/v1/reminders" });
  await app.register(createInventoryRoutes(inventoryService), { prefix: "/api/v1/inventory" });

  app.get("/health", async () => ({ status: "ok", service: "medications" }));

  // Start missed-reminder checker
  startMissedChecker(reminderRepo, statusLogRepo, config);

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  app.log.info(`Medications service running on port ${config.PORT}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
