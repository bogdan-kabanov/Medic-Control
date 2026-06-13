import { Pool } from "pg";

export interface AppointmentRow {
  id: string;
  student_id: string;
  student_name: string;
  doctor_type: string;
  reason: string;
  date_time: Date;
  priority: string;
  status: string;
  created_at: Date;
}

export interface AppointmentEntity {
  id: string;
  studentId: string;
  studentName: string;
  doctorType: string;
  reason: string;
  dateTime: Date;
  priority: string;
  status: string;
  createdAt: Date;
}

function mapRow(row: AppointmentRow): AppointmentEntity {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    doctorType: row.doctor_type,
    reason: row.reason,
    dateTime: row.date_time,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at,
  };
}

export interface AppointmentFilters {
  status?: string | undefined;
  page: number;
  pageSize: number;
}

export class AppointmentRepository {
  constructor(private pool: Pool) {}

  async findAll(filters: AppointmentFilters): Promise<{ items: AppointmentEntity[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (filters.page - 1) * filters.pageSize;

    const [countResult, dataResult] = await Promise.all([
      this.pool.query(`SELECT COUNT(*) as count FROM appointments ${whereClause}`, params),
      this.pool.query<AppointmentRow>(
        `SELECT * FROM appointments ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, filters.pageSize, offset]
      ),
    ]);

    return {
      items: dataResult.rows.map(mapRow),
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  async findById(id: string): Promise<AppointmentEntity | null> {
    const { rows } = await this.pool.query<AppointmentRow>(
      `SELECT * FROM appointments WHERE id = $1`,
      [id]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByStudentId(studentId: string): Promise<AppointmentEntity[]> {
    const { rows } = await this.pool.query<AppointmentRow>(
      `SELECT * FROM appointments WHERE student_id = $1 ORDER BY created_at DESC`,
      [studentId]
    );
    return rows.map(mapRow);
  }

  async create(data: {
    studentId: string;
    studentName: string;
    doctorType: string;
    reason: string;
    dateTime: Date;
    priority: string;
    status: string;
  }): Promise<AppointmentEntity> {
    const { rows } = await this.pool.query<AppointmentRow>(
      `INSERT INTO appointments (student_id, student_name, doctor_type, reason, date_time, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.studentId,
        data.studentName,
        data.doctorType,
        data.reason,
        data.dateTime,
        data.priority,
        data.status,
      ]
    );
    return mapRow(rows[0]!);
  }

  async updateStatus(id: string, status: string): Promise<AppointmentEntity> {
    const { rows } = await this.pool.query<AppointmentRow>(
      `UPDATE appointments SET status = $2 WHERE id = $1 RETURNING *`,
      [id, status]
    );
    return mapRow(rows[0]!);
  }
}
