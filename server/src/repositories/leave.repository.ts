import { BaseRepository } from './BaseRepository';

export interface LeaveEntity {
  id: string;
  worker_id: string;
  worker_name?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: string;
  comment?: string;
  created_at: string;
}

export class LeaveRepository extends BaseRepository<LeaveEntity> {
  constructor() {
    super('leaves');
  }

  async save(l: LeaveEntity): Promise<void> {
    await this.query(`
      INSERT INTO ${this.tableName} (
        id, worker_id, worker_name, leave_type, start_date, end_date, reason, status, comment, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        comment = EXCLUDED.comment;
    `, [
      l.id, l.worker_id, l.worker_name, l.leave_type, l.start_date, l.end_date, l.reason, l.status, l.comment, l.created_at
    ]);
  }

  async findOrderedByCreatedAt(): Promise<LeaveEntity[]> {
    const result = await this.query(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
    return result.rows;
  }
}
