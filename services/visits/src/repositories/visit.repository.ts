import { Pool } from "pg";

export interface VisitRow {
  id: string;
  student_id: string | null;
  first_name: string;
  last_name: string;
  grade: string;
  arrival_time: string;
  complaint: string;
  complaint_type: string;
  treatment_given: string;
  scheduled_doctor_appointment: boolean;
  created_at: Date;
}

export interface VisitEntity {
  id: string;
  studentId: string | null;
  firstName: string;
  lastName: string;
  grade: string;
  arrivalTime: string;
  complaint: string;
  complaintType: string;
  treatmentGiven: string;
  scheduledDoctorAppointment: boolean;
  createdAt: Date;
}

function mapRow(row: VisitRow): VisitEntity {
  return {
    id: row.id,
    studentId: row.student_id,
    firstName: row.first_name,
    lastName: row.last_name,
    grade: row.grade,
    arrivalTime: row.arrival_time,
    complaint: row.complaint,
    complaintType: row.complaint_type,
    treatmentGiven: row.treatment_given,
    scheduledDoctorAppointment: row.scheduled_doctor_appointment,
    createdAt: row.created_at,
  };
}

export interface VisitFilters {
  date?: string | undefined;
  search?: string | undefined;
  page: number;
  pageSize: number;
}

export class VisitRepository {
  constructor(private pool: Pool) {}

  async findAll(filters: VisitFilters): Promise<{ items: VisitEntity[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.date) {
      conditions.push(`created_at >= $${paramIndex} AND created_at < $${paramIndex + 1}`);
      params.push(`${filters.date}T00:00:00.000Z`, `${filters.date}T23:59:59.999Z`);
      paramIndex += 2;
    }

    if (filters.search) {
      conditions.push(`(first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR grade ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (filters.page - 1) * filters.pageSize;

    const [countResult, dataResult] = await Promise.all([
      this.pool.query(`SELECT COUNT(*) as count FROM visits ${whereClause}`, params),
      this.pool.query<VisitRow>(
        `SELECT * FROM visits ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, filters.pageSize, offset]
      ),
    ]);

    return {
      items: dataResult.rows.map(mapRow),
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  async findById(id: string): Promise<VisitEntity | null> {
    const { rows } = await this.pool.query<VisitRow>(
      `SELECT * FROM visits WHERE id = $1`,
      [id]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByStudentId(studentId: string): Promise<VisitEntity[]> {
    const { rows } = await this.pool.query<VisitRow>(
      `SELECT * FROM visits WHERE student_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [studentId]
    );
    return rows.map(mapRow);
  }

  async create(data: {
    studentId: string | null;
    firstName: string;
    lastName: string;
    grade: string;
    arrivalTime: string;
    complaint: string;
    complaintType: string;
    treatmentGiven: string;
    scheduledDoctorAppointment: boolean;
  }): Promise<VisitEntity> {
    const { rows } = await this.pool.query<VisitRow>(
      `INSERT INTO visits (student_id, first_name, last_name, grade, arrival_time, complaint, complaint_type, treatment_given, scheduled_doctor_appointment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.studentId,
        data.firstName,
        data.lastName,
        data.grade,
        data.arrivalTime,
        data.complaint,
        data.complaintType,
        data.treatmentGiven,
        data.scheduledDoctorAppointment,
      ]
    );
    return mapRow(rows[0]!);
  }
}
