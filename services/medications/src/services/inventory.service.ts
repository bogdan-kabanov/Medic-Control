import type { CreateInventoryItem, UpdateInventoryItem } from "@medcare/contracts";
import { ok, err, type Result } from "@medcare/contracts";
import type { InventoryRepository, InventoryItemEntity } from "../repositories/inventory.repository.js";

export interface InventoryItemResponse {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
  updatedAt: string;
}

function mapToResponse(entity: InventoryItemEntity): InventoryItemResponse {
  return {
    id: entity.id,
    name: entity.name,
    unit: entity.unit,
    currentStock: entity.currentStock,
    minThreshold: entity.minThreshold,
    updatedAt: entity.updatedAt.toISOString(),
  };
}

export class InventoryService {
  constructor(private inventoryRepo: InventoryRepository) {}

  async getInventory(filters: { search?: string | undefined; page: number; pageSize: number }) {
    const { items, total } = await this.inventoryRepo.findAll(filters);
    return {
      items: items.map(mapToResponse),
      meta: {
        total,
        page: filters.page,
        pageSize: filters.pageSize,
        totalPages: Math.ceil(total / filters.pageSize),
      },
    };
  }

  async addStock(data: CreateInventoryItem): Promise<{ item: InventoryItemResponse; created: boolean }> {
    const existing = await this.inventoryRepo.findByName(data.name);
    if (existing) {
      const updated = await this.inventoryRepo.update(existing.id, {
        currentStock: existing.currentStock + data.quantity,
      });
      return { item: mapToResponse(updated), created: false };
    }

    const item = await this.inventoryRepo.create({
      name: data.name,
      unit: data.unit,
      currentStock: data.quantity,
      minThreshold: data.minThreshold,
    });
    return { item: mapToResponse(item), created: true };
  }

  async getItem(id: string): Promise<InventoryItemResponse | null> {
    const entity = await this.inventoryRepo.findById(id);
    if (!entity) return null;
    return mapToResponse(entity);
  }

  async updateItem(id: string, data: UpdateInventoryItem): Promise<Result<InventoryItemResponse>> {
    const existing = await this.inventoryRepo.findById(id);
    if (!existing) {
      return err({ code: "NOT_FOUND", message: "Not found", statusCode: 404 });
    }

    const updateData: Partial<{ currentStock: number; minThreshold: number }> = {};
    if (data.currentStock !== undefined) updateData.currentStock = data.currentStock;
    if (data.minThreshold !== undefined) updateData.minThreshold = data.minThreshold;

    const updated = await this.inventoryRepo.update(id, updateData);
    return ok(mapToResponse(updated));
  }
}
