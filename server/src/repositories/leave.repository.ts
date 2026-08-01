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
  organization_id?: string;
}

export class LeaveRepository extends BaseRepository<LeaveEntity> {
  constructor() {
    super('leaves');
  }

  async findAllByOrg(orgId: string): Promise<LeaveEntity[]> {
    const result = await this.query(
      `SELECT * FROM ${this.tableName} WHERE organization_id = $1 ORDER BY created_at DESC`,
      [orgId]
    );
    return result.rows;
  }

  async findAllByWorker(workerId: string, orgId: string): Promise<LeaveEntity[]> {
    const result = await this.query(
      `SELECT * FROM ${this.tableName} WHERE worker_id = $1 AND organization_id = $2 ORDER BY created_at DESC`,
      [workerId, orgId]
    );
    return result.rows;
  }

  async save(l: LeaveEntity): Promise<void> {
    await this.query(`
      INSERT INTO ${this.tableName} (
        id, worker_id, worker_name, leave_type, start_date, end_date, reason, status, comment, created_at, organization_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        comment = EXCLUDED.comment
      WHERE leaves.organization_id = EXCLUDED.organization_id;
    `, [
      l.id, l.worker_id, l.worker_name, l.leave_type, l.start_date, l.end_date, l.reason, l.status, l.comment, l.created_at, l.organization_id
    ]);
  }
}
