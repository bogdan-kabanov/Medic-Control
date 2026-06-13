import { Pool } from "pg";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: string;
  student_id: string | null;
  is_active: boolean;
  activation_code: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: string;
  studentId: string | null;
  isActive: boolean;
  activationCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapRow(row: UserRow): UserEntity {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    studentId: row.student_id,
    isActive: row.is_active,
    activationCode: row.activation_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class UserRepository {
  constructor(private pool: Pool) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const { rows } = await this.pool.query<UserRow>(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const { rows } = await this.pool.query<UserRow>(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByActivationCode(code: string): Promise<UserEntity | null> {
    const { rows } = await this.pool.query<UserRow>(
      `SELECT * FROM users WHERE activation_code = $1 AND is_active = false`,
      [code]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: string;
    studentId: string | null;
    isActive: boolean;
    activationCode: string | null;
  }): Promise<UserEntity> {
    const { rows } = await this.pool.query<UserRow>(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, student_id, is_active, activation_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.email,
        data.passwordHash,
        data.firstName,
        data.lastName,
        data.role,
        data.studentId,
        data.isActive,
        data.activationCode,
      ]
    );
    return mapRow(rows[0]!);
  }

  async updatePassword(id: string, passwordHash: string, activate: boolean): Promise<void> {
    if (activate) {
      await this.pool.query(
        `UPDATE users SET password_hash = $2, is_active = true, activation_code = NULL, updated_at = NOW() WHERE id = $1`,
        [id, passwordHash]
      );
    } else {
      await this.pool.query(
        `UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`,
        [id, passwordHash]
      );
    }
  }
}
