import { FastifyInstance } from "fastify";
import { CreateReminderSchema, ConfirmReminderSchema } from "@medcare/contracts";
import { z } from "zod";
import type { ReminderService } from "../services/reminder.service.js";

const QuerySchema = z.object({
  status: z.string().optional(),
  date: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export function createReminderRoutes(reminderService: ReminderService) {
  return async function remindersRoutes(app: FastifyInstance) {
    // GET /reminders
    app.get("/", async (request) => {
      const query = QuerySchema.parse(request.query);
      return reminderService.getReminders(query);
    });

    // GET /reminders/my (student portal)
    app.get("/my", async (request, reply) => {
      const studentId = (request.headers as Record<string, string>)["x-student-id"];
      if (!studentId) return reply.status(401).send({ message: "Unauthorized" });
      return reminderService.getMyReminders(studentId);
    });

    // POST /reminders
    app.post("/", async (request, reply) => {
      const body = CreateReminderSchema.parse(request.body);
      const reminder = await reminderService.createReminder(body);
      return reply.status(201).send(reminder);
    });

    // POST /reminders/course (create a full course of reminders)
    app.post("/course", async (request, reply) => {
      const body = z.object({
        studentId: z.string().min(1),
        medication: z.string().min(1),
        dosage: z.string().min(1),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        durationDays: z.number().int().min(1).max(90),
        times: z.array(z.string().regex(/^\d{2}:\d{2}$/)).min(1),
        notes: z.string().default(""),
      }).parse(request.body);

      const result = await reminderService.createCourse(body);
      return reply.status(201).send(result);
    });

    // PATCH /reminders/:id/done (nurse marks done)
    app.patch("/:id/done", async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const result = await reminderService.markDone(id);
      if (!result.ok) {
        return reply.status(result.error.statusCode).send({ message: result.error.message });
      }
      return result.data;
    });

    // PATCH /reminders/:id/confirm (student confirms intake)
    app.patch("/:id/confirm", async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = ConfirmReminderSchema.parse(request.body);
      const result = await reminderService.confirmIntake(id, body);
      if (!result.ok) {
        return reply.status(result.error.statusCode).send({ message: result.error.message });
      }
      return result.data;
    });
  };
}
