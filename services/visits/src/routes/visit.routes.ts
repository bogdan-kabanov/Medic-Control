import { FastifyInstance } from "fastify";
import { CreateVisitSchema } from "@medcare/contracts";
import { z } from "zod";
import type { VisitService } from "../services/visit.service.js";

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export function createVisitRoutes(visitService: VisitService) {
  return async function visitsRoutes(app: FastifyInstance) {
    // GET /visits
    app.get("/", async (request) => {
      const query = QuerySchema.parse(request.query);
      return visitService.getVisits(query);
    });

    // GET /visits/my (for student portal)
    app.get("/my", async (request, reply) => {
      const studentId = (request.headers as Record<string, string>)["x-student-id"];
      if (!studentId) return reply.status(401).send({ message: "Unauthorized" });
      return visitService.getMyVisits(studentId);
    });

    // POST /visits
    app.post("/", async (request, reply) => {
      const body = CreateVisitSchema.parse(request.body);
      const visit = await visitService.createVisit(body);
      return reply.status(201).send(visit);
    });

    // GET /visits/:id
    app.get("/:id", async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const result = await visitService.getVisit(id);
      if (!result.ok) {
        return reply.status(result.error.statusCode).send({ message: result.error.message });
      }
      return result.data;
    });
  };
}
