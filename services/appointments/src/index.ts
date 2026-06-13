import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadConfig } from "./config.js";
import { pool } from "./database.js";
import { AppointmentRepository } from "./repositories/appointment.repository.js";
import { AppointmentService } from "./services/appointment.service.js";
import { createAppointmentRoutes } from "./routes/appointment.routes.js";
import { startConsumer } from "./consumer.js";

const config = loadConfig();

const app = Fastify({
  logger: { transport: { target: "pino-pretty", options: { colorize: true } } },
});

async function start() {
  const appointmentRepo = new AppointmentRepository(pool);
  const appointmentService = new AppointmentService(appointmentRepo);

  await app.register(cors, {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  });

  await app.register(createAppointmentRoutes(appointmentService), { prefix: "/api/v1/appointments" });

  app.get("/health", async () => ({ status: "ok", service: "appointments" }));

  // Start RabbitMQ consumer for referral events
  await startConsumer(appointmentService);

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  app.log.info(`Appointments service running on port ${config.PORT}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
