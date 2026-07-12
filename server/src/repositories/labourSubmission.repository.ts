import { BaseRepository } from './BaseRepository';

export interface LabourSubmissionEntity {
  id: string;
  worker_id: string;
  date: string;
  status: string;
  is_night_shift: boolean;
  overtime_hours: number;
  time_in?: string;
  time_out?: string;
  remarks?: string;
  created_at: string;
}

export class LabourSubmissionRepository extends BaseRepository<LabourSubmissionEntity> {
  constructor() {
    super('labour_submissions');
  }

  async save(ls: LabourSubmissionEntity): Promise<void> {
    await this.query(`
      INSERT INTO ${this.tableName} (
        id, worker_id, date, status, is_night_shift, overtime_hours, time_in, time_out, remarks, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (worker_id, date) DO UPDATE SET
        status = EXCLUDED.status,
        is_night_shift = EXCLUDED.is_night_shift,
        overtime_hours = EXCLUDED.overtime_hours,
        time_in = EXCLUDED.time_in,
        time_out = EXCLUDED.time_out,
        remarks = EXCLUDED.remarks,
        created_at = EXCLUDED.created_at;
    `, [
      ls.id, ls.worker_id, ls.date, ls.status, ls.is_night_shift, ls.overtime_hours, ls.time_in, ls.time_out, ls.remarks, ls.created_at
    ]);
  }

  async findOrderedByDate(): Promise<LabourSubmissionEntity[]> {
    const result = await this.query(`SELECT * FROM ${this.tableName} ORDER BY date DESC`);
    return result.rows;
  }
}
