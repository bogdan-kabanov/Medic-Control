import { Pool } from "pg";

export interface ReminderRow {
  id: string;
  student_id: string;
  student_name: string;
  medication: string;
  dosage: string;
  date_time: Date;
  notes: string;
  status: string;
  confirmed_at: Date | null;
  confirmed_by: string | null;
  course_id: string | null;
  course_name: string | null;
  created_at: Date;
}

export interface ReminderEntity {
  id: string;
  studentId: string;
  studentName: string;
  medication: string;
  dosage: string;
  dateTime: Date;
  notes: string;
  status: string;
  confirmedAt: Date | null;
  confirmedBy: string | null;
  courseId: string | null;
  courseName: string | null;
  createdAt: Date;
}

function mapRow(row: ReminderRow): ReminderEntity {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    medication: row.medication,
    dosage: row.dosage,
    dateTime: row.date_time,
    notes: row.notes,
    status: row.status,
    confirmedAt: row.confirmed_at,
    confirmedBy: row.confirmed_by,
    courseId: row.course_id,
    courseName: row.course_name,
    createdAt: row.created_at,
  };
}

export interface ReminderFilters {
  status?: string | undefined;
  date?: string | undefined;
  page: number;
  pageSize: number;
}

export class ReminderRepository {
  constructor(private pool: Pool) {}

  async findAll(filters: ReminderFilters): Promise<{ items: ReminderEntity[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.date) {
      conditions.push(`date_time >= $${paramIndex} AND date_time <= $${paramIndex + 1}`);
      params.push(`${filters.date}T00:00:00.000Z`, `${filters.date}T23:59:59.999Z`);
      paramIndex += 2;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (filters.page - 1) * filters.pageSize;

    const [countResult, dataResult] = await Promise.all([
      this.pool.query(`SELECT COUNT(*) as count FROM reminders ${whereClause}`, params),
      this.pool.query<ReminderRow>(
        `SELECT * FROM reminders ${whereClause} ORDER BY date_time ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, filters.pageSize, offset]
      ),
    ]);

    return {
      items: dataResult.rows.map(mapRow),
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  async findById(id: string): Promise<ReminderEntity | null> {
    const { rows } = await this.pool.query<ReminderRow>(
      `SELECT * FROM reminders WHERE id = $1`,
      [id]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByStudentId(studentId: string): Promise<ReminderEntity[]> {
    // Return only today's reminders (pending for today + already confirmed today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { rows } = await this.pool.query<ReminderRow>(
      `SELECT * FROM reminders 
       WHERE student_id = $1 
       AND date_time >= $2 AND date_time <= $3
       ORDER BY CASE WHEN status = 'Pending' THEN 0 ELSE 1 END, date_time ASC`,
      [studentId, todayStart, todayEnd]
    );
    return rows.map(mapRow);
  }

  async findCourseProgress(studentId: string, courseId: string): Promise<{ total: number; done: number }> {
    const { rows } = await this.pool.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status IN ('Done', 'EarlyIntake')) as done
       FROM reminders WHERE student_id = $1 AND course_id = $2`,
      [studentId, courseId]
    );
    return { total: Number(rows[0].total), done: Number(rows[0].done) };
  }

  async create(data: {
    studentId: string;
    studentName: string;
    medication: string;
    dosage: string;
    dateTime: Date;
    notes: string;
    status: string;
    courseId?: string;
    courseName?: string;
  }): Promise<ReminderEntity> {
    const { rows } = await this.pool.query<ReminderRow>(
      `INSERT INTO reminders (student_id, student_name, medication, dosage, date_time, notes, status, course_id, course_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [data.studentId, data.studentName, data.medication, data.dosage, data.dateTime, data.notes, data.status, data.courseId ?? null, data.courseName ?? null]
    );
    return mapRow(rows[0]!);
  }

  async updateStatus(id: string, status: string, confirmedAt?: Date, confirmedBy?: string): Promise<ReminderEntity> {
    const { rows } = await this.pool.query<ReminderRow>(
      `UPDATE reminders SET status = $2, confirmed_at = $3, confirmed_by = $4 WHERE id = $1 RETURNING *`,
      [id, status, confirmedAt ?? null, confirmedBy ?? null]
    );
    return mapRow(rows[0]!);
  }

  async findPendingBefore(cutoff: Date): Promise<ReminderEntity[]> {
    const { rows } = await this.pool.query<ReminderRow>(
      `SELECT * FROM reminders WHERE status = 'Pending' AND date_time < $1`,
      [cutoff]
    );
    return rows.map(mapRow);
  }

  async markMissed(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE reminders SET status = 'Missed' WHERE id = $1`,
      [id]
    );
  }
}
