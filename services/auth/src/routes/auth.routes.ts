import { FastifyInstance } from "fastify";
import {
  LoginRequestSchema,
  RefreshRequestSchema,
  RegisterStudentRequestSchema,
  ActivateAccountRequestSchema,
} from "@medcare/contracts";
import type { AuthService } from "../services/auth.service.js";

export function createAuthRoutes(authService: AuthService) {
  return async function authRoutes(app: FastifyInstance) {
    // POST /auth/login
    app.post("/login", async (request, reply) => {
      const body = LoginRequestSchema.parse(request.body);
      const result = await authService.login(body.email, body.password);

      if (!result.ok) {
        return reply.status(result.error.statusCode).send({
          statusCode: result.error.statusCode,
          error: result.error.code,
          message: result.error.message,
        });
      }

      reply.setCookie("refreshToken", result.data.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        path: "/api/v1/auth",
        maxAge: 7 * 24 * 60 * 60,
      });

      return { accessToken: result.data.accessToken, refreshToken: result.data.refreshToken };
    });

    // POST /auth/refresh
    app.post("/refresh", async (request, reply) => {
      const body = RefreshRequestSchema.parse(request.body);
      const result = await authService.refresh(body.refreshToken);

      if (!result.ok) {
        return reply.status(result.error.statusCode).send({
          statusCode: result.error.statusCode,
          error: result.error.code,
          message: result.error.message,
        });
      }

      return { accessToken: result.data.accessToken };
    });

    // POST /auth/logout
    app.post("/logout", async (request, reply) => {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return reply.status(401).send({ statusCode: 401, error: "UNAUTHORIZED", message: "No token" });
      }

      const token = authHeader.replace("Bearer ", "");
      await authService.logout(token);
      reply.clearCookie("refreshToken", { path: "/api/v1/auth" });
      return { message: "Logged out" };
    });

    // GET /auth/verify
    app.get("/verify", async (request, reply) => {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return reply.status(401).send({ statusCode: 401, error: "UNAUTHORIZED", message: "No token" });
      }

      const token = authHeader.replace("Bearer ", "");
      const result = await authService.verify(token);

      if (!result.ok) {
        return reply.status(result.error.statusCode).send({
          statusCode: result.error.statusCode,
          error: result.error.code,
          message: result.error.message,
        });
      }

      return result.data;
    });

    // GET /auth/me
    app.get("/me", async (request, reply) => {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return reply.status(401).send({ statusCode: 401, error: "UNAUTHORIZED", message: "No token" });
      }

      const token = authHeader.replace("Bearer ", "");
      const result = await authService.me(token);

      if (!result.ok) {
        return reply.status(result.error.statusCode).send({
          statusCode: result.error.statusCode,
          error: result.error.code,
          message: result.error.message,
        });
      }

      return result.data;
    });

    // POST /auth/register-student
    app.post("/register-student", async (request, reply) => {
      const body = RegisterStudentRequestSchema.parse(request.body);
      const result = await authService.registerStudent(body);

      if (!result.ok) {
        return reply.status(result.error.statusCode).send({
          statusCode: result.error.statusCode,
          error: result.error.code,
          message: result.error.message,
        });
      }

      return reply.status(201).send(result.data);
    });

    // POST /auth/activate
    app.post("/activate", async (request, reply) => {
      const body = ActivateAccountRequestSchema.parse(request.body);
      const result = await authService.activate(body.code, body.password);

      if (!result.ok) {
        return reply.status(result.error.statusCode).send({
          statusCode: result.error.statusCode,
          error: result.error.code,
          message: result.error.message,
        });
      }

      return { message: "Account activated" };
    });
  };
}
