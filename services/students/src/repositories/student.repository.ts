import { Pool } from "pg";

export interface StudentRow {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  grade: string;
  age: number;
  diseases: string[];
  medications: unknown;
  counselor: unknown;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface StudentEntity {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  grade: string;
  age: number;
  diseases: string[];
  medications: unknown;
  counselor: unknown;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapRow(row: StudentRow): StudentEntity {
  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    grade: row.grade,
    age: row.age,
    diseases: row.diseases,
    medications: row.medications,
    counselor: row.counselor,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface StudentFilters {
  search?: string | undefined;
  grade?: string | undefined;
  disease?: string | undefined;
  page: number;
  pageSize: number;
}

export class StudentRepository {
  constructor(private pool: Pool) {}

  async findAll(filters: StudentFilters): Promise<{ items: StudentEntity[]; total: number }> {
    const conditions: string[] = ["deleted_at IS NULL"];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.search) {
      conditions.push(`(first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.grade) {
      conditions.push(`grade = $${paramIndex}`);
      params.push(filters.grade);
      paramIndex++;
    }

    if (filters.disease) {
      conditions.push(`$${paramIndex} = ANY(diseases)`);
      params.push(filters.disease);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (filters.page - 1) * filters.pageSize;

    const countQuery = `SELECT COUNT(*) as count FROM students ${whereClause}`;
    const dataQuery = `SELECT * FROM students ${whereClause} ORDER BY last_name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const [countResult, dataResult] = await Promise.all([
      this.pool.query(countQuery, params),
      this.pool.query<StudentRow>(dataQuery, [...params, filters.pageSize, offset]),
    ]);

    return {
      items: dataResult.rows.map(mapRow),
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  async findById(id: string): Promise<StudentEntity | null> {
    const { rows } = await this.pool.query<StudentRow>(
      `SELECT * FROM students WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByUserId(userId: string): Promise<StudentEntity | null> {
    const { rows } = await this.pool.query<StudentRow>(
      `SELECT * FROM students WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(data: {
    firstName: string;
    lastName: string;
    grade: string;
    age: number;
    diseases: string[];
    medications: unknown;
    counselor: unknown;
  }): Promise<StudentEntity> {
    const { rows } = await this.pool.query<StudentRow>(
      `INSERT INTO students (first_name, last_name, grade, age, diseases, medications, counselor)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.firstName,
        data.lastName,
        data.grade,
        data.age,
        data.diseases,
        JSON.stringify(data.medications),
        JSON.stringify(data.counselor),
      ]
    );
    return mapRow(rows[0]!);
  }

  async update(id: string, data: Partial<{
    firstName: string;
    lastName: string;
    grade: string;
    age: number;
    diseases: string[];
    medications: unknown;
    counselor: unknown;
  }>): Promise<StudentEntity> {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (data.firstName !== undefined) {
      setClauses.push(`first_name = $${paramIndex++}`);
      params.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      setClauses.push(`last_name = $${paramIndex++}`);
      params.push(data.lastName);
    }
    if (data.grade !== undefined) {
      setClauses.push(`grade = $${paramIndex++}`);
      params.push(data.grade);
    }
    if (data.age !== undefined) {
      setClauses.push(`age = $${paramIndex++}`);
      params.push(data.age);
    }
    if (data.diseases !== undefined) {
      setClauses.push(`diseases = $${paramIndex++}`);
      params.push(data.diseases);
    }
    if (data.medications !== undefined) {
      setClauses.push(`medications = $${paramIndex++}`);
      params.push(JSON.stringify(data.medications));
    }
    if (data.counselor !== undefined) {
      setClauses.push(`counselor = $${paramIndex++}`);
      params.push(JSON.stringify(data.counselor));
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const { rows } = await this.pool.query<StudentRow>(
      `UPDATE students SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    return mapRow(rows[0]!);
  }

  async softDelete(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE students SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  async autocomplete(q: string): Promise<{ id: string; firstName: string; lastName: string; grade: string }[]> {
    const { rows } = await this.pool.query<{ id: string; first_name: string; last_name: string; grade: string }>(
      `SELECT id, first_name, last_name, grade FROM students
       WHERE deleted_at IS NULL AND (first_name ILIKE $1 OR last_name ILIKE $1)
       LIMIT 10`,
      [`%${q}%`]
    );
    return rows.map((r) => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      grade: r.grade,
    }));
  }
}
