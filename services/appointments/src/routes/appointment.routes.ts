import { FastifyInstance } from "fastify";
import { CreateAppointmentSchema } from "@medcare/contracts";
import { z } from "zod";
import type { AppointmentService } from "../services/appointment.service.js";

const QuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export function createAppointmentRoutes(appointmentService: AppointmentService) {
  return async function appointmentsRoutes(app: FastifyInstance) {
    // GET /appointments
    app.get("/", async (request) => {
      const query = QuerySchema.parse(request.query);
      return appointmentService.getAppointments(query);
    });

    // GET /appointments/my (student portal)
    app.get("/my", async (request, reply) => {
      const studentId = (request.headers as Record<string, string>)["x-student-id"];
      if (!studentId) return reply.status(401).send({ message: "Unauthorized" });
      return appointmentService.getMyAppointments(studentId);
    });

    // POST /appointments
    app.post("/", async (request, reply) => {
      const body = CreateAppointmentSchema.parse(request.body);
      const appointment = await appointmentService.createAppointment(body);
      return reply.status(201).send(appointment);
    });

    // GET /appointments/:id
    app.get("/:id", async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const result = await appointmentService.getAppointment(id);
      if (!result.ok) {
        return reply.status(result.error.statusCode).send({ message: result.error.message });
      }
      return result.data;
    });

    // PATCH /appointments/:id/approve
    app.patch("/:id/approve", async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const result = await appointmentService.approve(id);
      if (!result.ok) {
        return reply.status(result.error.statusCode).send({ message: result.error.message });
      }
      return result.data;
    });

    // PATCH /appointments/:id/cancel
    app.patch("/:id/cancel", async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const result = await appointmentService.cancel(id);
      if (!result.ok) {
        return reply.status(result.error.statusCode).send({ message: result.error.message });
      }
      return result.data;
    });

    // PATCH /appointments/:id/complete
    app.patch("/:id/complete", async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const result = await appointmentService.complete(id);
      if (!result.ok) {
        return reply.status(result.error.statusCode).send({ message: result.error.message });
      }
      return result.data;
    });
  };
}
