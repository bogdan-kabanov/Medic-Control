import { FastifyInstance } from "fastify";
import { CreateStudentSchema, UpdateStudentSchema } from "@medcare/contracts";
import { z } from "zod";
import type { StudentService } from "../services/student.service.js";

const QuerySchema = z.object({
  search: z.string().optional(),
  grade: z.string().optional(),
  disease: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export function createStudentRoutes(studentService: StudentService) {
  return async function studentsRoutes(app: FastifyInstance) {
    // GET /students
    app.get("/", async (request) => {
      const query = QuerySchema.parse(request.query);
      return studentService.getStudents(query);
    });

    // GET /students/autocomplete
    app.get("/autocomplete", async (request) => {
      const { q } = z.object({ q: z.string().min(2) }).parse(request.query);
      return studentService.autocomplete(q);
    });

    // GET /students/me (for student portal)
    app.get("/me", async (request, reply) => {
      const userId = (request.headers as Record<string, string>)["x-user-id"];
      if (!userId) return reply.status(401).send({ message: "Unauthorized" });

      const result = await studentService.getMyProfile(userId);
      if (!result.ok) {
        return reply.status(result.error.statusCode).send({ message: result.error.message });
      }
      return result.data;
    });

    // POST /students
    app.post("/", async (request, reply) => {
      const body = CreateStudentSchema.parse(request.body);
      const student = await studentService.createStudent(body);
      return reply.status(201).send(student);
    });

    // GET /students/:id
    app.get("/:id", async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const result = await studentService.getStudent(id);
      if (!result.ok) {
        return reply.status(result.error.statusCode).send({ message: result.error.message });
      }
      return result.data;
    });

    // PATCH /students/:id
    app.patch("/:id", async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = UpdateStudentSchema.parse(request.body);
      const result = await studentService.updateStudent(id, body);
      if (!result.ok) {
        return reply.status(result.error.statusCode).send({ message: result.error.message });
      }
      return result.data;
    });

    // DELETE /students/:id (soft-delete)
    app.delete("/:id", async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const result = await studentService.deleteStudent(id);
      if (!result.ok) {
        return reply.status(result.error.statusCode).send({ message: result.error.message });
      }
      return reply.status(204).send();
    });
  };
}
