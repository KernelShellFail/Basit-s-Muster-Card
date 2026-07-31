import { BaseRepository } from './BaseRepository';
import { pool } from '../db';

export interface AttendanceEntity {
  id: string;
  worker_id: string;
  date: string;
  status: string;
  is_night_shift: boolean;
  overtime_hours: number;
  time_in?: string;
  time_out?: string;
  gps_coordinates?: string;
  photo_proof?: string;
  supervisor_id?: string;
  site_id: string;
  remarks?: string;
  organization_id?: string;
}

export class AttendanceRepository extends BaseRepository<AttendanceEntity> {
  constructor() {
    super('attendance');
  }

  async findAllByOrg(orgId: string): Promise<AttendanceEntity[]> {
    const result = await this.query(
      `SELECT * FROM ${this.tableName} WHERE organization_id = $1 ORDER BY date DESC`,
      [orgId]
    );
    return result.rows;
  }

  async findAllByWorker(workerId: string): Promise<AttendanceEntity[]> {
    const result = await this.query(
      `SELECT * FROM ${this.tableName} WHERE worker_id = $1 ORDER BY date DESC`,
      [workerId]
    );
    return result.rows;
  }

  async findAllBySite(siteId: string): Promise<AttendanceEntity[]> {
    const result = await this.query(
      `SELECT * FROM ${this.tableName} WHERE site_id = $1 ORDER BY date DESC`,
      [siteId]
    );
    return result.rows;
  }

  async saveBatch(records: AttendanceEntity[]): Promise<void> {
    if (!records.length) return;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const rec of records) {
        await client.query(
          `
          INSERT INTO ${this.tableName} (
            id, worker_id, date, status, is_night_shift, overtime_hours,
            time_in, time_out, gps_coordinates, photo_proof, supervisor_id, site_id, remarks, organization_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            worker_id = EXCLUDED.worker_id,
            date = EXCLUDED.date,
            status = EXCLUDED.status,
            is_night_shift = EXCLUDED.is_night_shift,
            overtime_hours = EXCLUDED.overtime_hours,
            time_in = EXCLUDED.time_in,
            time_out = EXCLUDED.time_out,
            gps_coordinates = EXCLUDED.gps_coordinates,
            photo_proof = EXCLUDED.photo_proof,
            supervisor_id = EXCLUDED.supervisor_id,
            site_id = EXCLUDED.site_id,
            remarks = EXCLUDED.remarks,
            organization_id = EXCLUDED.organization_id;
          `,
          [
            rec.id, rec.worker_id, rec.date, rec.status, rec.is_night_shift, rec.overtime_hours,
            rec.time_in, rec.time_out, rec.gps_coordinates, rec.photo_proof, rec.supervisor_id, rec.site_id, rec.remarks, rec.organization_id
          ]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
