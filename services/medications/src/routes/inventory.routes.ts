import { FastifyInstance } from "fastify";
import { CreateInventoryItemSchema, UpdateInventoryItemSchema } from "@medcare/contracts";
import { z } from "zod";
import type { InventoryService } from "../services/inventory.service.js";

const QuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export function createInventoryRoutes(inventoryService: InventoryService) {
  return async function inventoryRoutes(app: FastifyInstance) {
    // GET /inventory
    app.get("/", async (request) => {
      const query = QuerySchema.parse(request.query);
      return inventoryService.getInventory(query);
    });

    // POST /inventory
    app.post("/", async (request, reply) => {
      const body = CreateInventoryItemSchema.parse(request.body);
      const { item, created } = await inventoryService.addStock(body);
      return reply.status(created ? 201 : 200).send(item);
    });

    // GET /inventory/:id
    app.get("/:id", async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const result = await inventoryService.getItem(id);
      if (!result) return reply.status(404).send({ message: "Not found" });
      return result;
    });

    // PATCH /inventory/:id
    app.patch("/:id", async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = UpdateInventoryItemSchema.parse(request.body);
      const result = await inventoryService.updateItem(id, body);
      if (!result.ok) {
        return reply.status(result.error.statusCode).send({ message: result.error.message });
      }
      return result.data;
    });
  };
}
