import { Pool } from "pg";

export class StatusLogRepository {
  constructor(private pool: Pool) {}

  async create(data: {
    reminderId: string;
    previousStatus: string;
    newStatus: string;
    changedBy: string;
    reason?: string;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO reminder_status_logs (reminder_id, previous_status, new_status, changed_by, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [data.reminderId, data.previousStatus, data.newStatus, data.changedBy, data.reason ?? ""]
    );
  }
}
