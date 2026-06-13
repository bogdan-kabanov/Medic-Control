import { Pool } from "pg";

export interface InventoryItemRow {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_threshold: number;
  updated_at: Date;
}

export interface InventoryItemEntity {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
  updatedAt: Date;
}

function mapRow(row: InventoryItemRow): InventoryItemEntity {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    currentStock: row.current_stock,
    minThreshold: row.min_threshold,
    updatedAt: row.updated_at,
  };
}

export interface InventoryFilters {
  search?: string | undefined;
  page: number;
  pageSize: number;
}

export class InventoryRepository {
  constructor(private pool: Pool) {}

  async findAll(filters: InventoryFilters): Promise<{ items: InventoryItemEntity[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.search) {
      conditions.push(`name ILIKE $${paramIndex}`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (filters.page - 1) * filters.pageSize;

    const [countResult, dataResult] = await Promise.all([
      this.pool.query(`SELECT COUNT(*) as count FROM inventory_items ${whereClause}`, params),
      this.pool.query<InventoryItemRow>(
        `SELECT * FROM inventory_items ${whereClause} ORDER BY name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, filters.pageSize, offset]
      ),
    ]);

    return {
      items: dataResult.rows.map(mapRow),
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  async findById(id: string): Promise<InventoryItemEntity | null> {
    const { rows } = await this.pool.query<InventoryItemRow>(
      `SELECT * FROM inventory_items WHERE id = $1`,
      [id]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByName(name: string): Promise<InventoryItemEntity | null> {
    const { rows } = await this.pool.query<InventoryItemRow>(
      `SELECT * FROM inventory_items WHERE name = $1`,
      [name]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(data: {
    name: string;
    unit: string;
    currentStock: number;
    minThreshold: number;
  }): Promise<InventoryItemEntity> {
    const { rows } = await this.pool.query<InventoryItemRow>(
      `INSERT INTO inventory_items (name, unit, current_stock, min_threshold)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.name, data.unit, data.currentStock, data.minThreshold]
    );
    return mapRow(rows[0]!);
  }

  async update(id: string, data: Partial<{ currentStock: number; minThreshold: number }>): Promise<InventoryItemEntity> {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (data.currentStock !== undefined) {
      setClauses.push(`current_stock = $${paramIndex++}`);
      params.push(data.currentStock);
    }
    if (data.minThreshold !== undefined) {
      setClauses.push(`min_threshold = $${paramIndex++}`);
      params.push(data.minThreshold);
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const { rows } = await this.pool.query<InventoryItemRow>(
      `UPDATE inventory_items SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    return mapRow(rows[0]!);
  }
}
