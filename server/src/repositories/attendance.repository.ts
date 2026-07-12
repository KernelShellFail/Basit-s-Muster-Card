import { BaseRepository } from './BaseRepository';

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
}

export class AttendanceRepository extends BaseRepository<AttendanceEntity> {
  constructor() {
    super('attendance');
  }

  async saveBatch(records: AttendanceEntity[]): Promise<void> {
    const client = await this.query('SELECT 1'); // Obtain client via connection pool query or direct helper.
    // Instead of raw query, we use transaction block to execute batch updates
    for (const rec of records) {
      await this.query(`
        INSERT INTO ${this.tableName} (
          id, worker_id, date, status, is_night_shift, overtime_hours,
          time_in, time_out, gps_coordinates, photo_proof, supervisor_id, site_id, remarks
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          is_night_shift = EXCLUDED.is_night_shift,
          overtime_hours = EXCLUDED.overtime_hours,
          time_in = EXCLUDED.time_in,
          time_out = EXCLUDED.time_out,
          gps_coordinates = EXCLUDED.gps_coordinates,
          photo_proof = EXCLUDED.photo_proof,
          remarks = EXCLUDED.remarks;
      `, [
        rec.id, rec.worker_id, rec.date, rec.status, rec.is_night_shift, rec.overtime_hours,
        rec.time_in, rec.time_out, rec.gps_coordinates, rec.photo_proof, rec.supervisor_id, rec.site_id, rec.remarks
      ]);
    }
  }
}
