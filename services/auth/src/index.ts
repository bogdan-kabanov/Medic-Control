import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { loadConfig } from "./config.js";
import { pool } from "./database.js";
import { redis } from "./redis.js";
import { UserRepository } from "./repositories/user.repository.js";
import { AuthService } from "./services/auth.service.js";
import { createAuthRoutes } from "./routes/auth.routes.js";

const config = loadConfig();

const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  },
});

async function start() {
  // Wire dependencies
  const userRepo = new UserRepository(pool);
  const authService = new AuthService(userRepo, redis, config);

  await app.register(cors, {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  });

  await app.register(cookie);
  await app.register(createAuthRoutes(authService), { prefix: "/api/v1/auth" });

  app.get("/health", async () => ({ status: "ok", service: "auth" }));

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  app.log.info(`Auth service running on port ${config.PORT}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
