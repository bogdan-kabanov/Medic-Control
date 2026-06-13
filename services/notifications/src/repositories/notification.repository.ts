import { Pool } from "pg";

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata: unknown;
  created_at: Date;
}

export interface NotificationEntity {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata: unknown;
  createdAt: Date;
}

function mapRow(row: NotificationRow): NotificationEntity {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: row.is_read,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

export class NotificationRepository {
  constructor(private pool: Pool) {}

  async create(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<NotificationEntity> {
    const { rows } = await this.pool.query<NotificationRow>(
      `INSERT INTO notifications (user_id, type, title, message, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.userId, data.type, data.title, data.message, JSON.stringify(data.metadata ?? {})]
    );
    return mapRow(rows[0]!);
  }

  async findByUserId(userId: string): Promise<NotificationEntity[]> {
    const { rows } = await this.pool.query<NotificationRow>(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    return rows.map(mapRow);
  }
}
