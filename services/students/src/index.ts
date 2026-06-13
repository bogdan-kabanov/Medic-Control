import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadConfig } from "./config.js";
import { pool } from "./database.js";
import { StudentRepository } from "./repositories/student.repository.js";
import { StudentService } from "./services/student.service.js";
import { createStudentRoutes } from "./routes/student.routes.js";

const config = loadConfig();

const app = Fastify({
  logger: {
    transport: { target: "pino-pretty", options: { colorize: true } },
  },
});

async function start() {
  const studentRepo = new StudentRepository(pool);
  const studentService = new StudentService(studentRepo);

  await app.register(cors, {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  });

  await app.register(createStudentRoutes(studentService), { prefix: "/api/v1/students" });

  app.get("/health", async () => ({ status: "ok", service: "students" }));

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  app.log.info(`Students service running on port ${config.PORT}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
