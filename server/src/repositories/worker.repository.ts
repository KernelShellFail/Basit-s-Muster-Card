import { BaseRepository } from './BaseRepository';

export interface WorkerEntity {
  id: string;
  name: string;
  father_name?: string;
  gender?: string;
  dob?: string;
  phone?: string;
  emergency_contact?: string;
  address?: string;
  village?: string;
  district?: string;
  state?: string;
  pin_code?: string;
  aadhaar?: string;
  pan?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  upi_id?: string;
  joining_date?: string;
  trade?: string;
  department?: string;
  skill_level?: string;
  daily_wage?: number;
  overtime_rate?: number;
  current_site_id?: string;
  status?: string;
  photo?: string;
  notes?: string;
}

export class WorkerRepository extends BaseRepository<WorkerEntity> {
  constructor() {
    super('workers');
  }

  async save(w: WorkerEntity): Promise<void> {
    await this.query(`
      INSERT INTO ${this.tableName} (
        id, name, father_name, gender, dob, phone, emergency_contact,
        address, village, district, state, pin_code, aadhaar, pan,
        bank_name, account_number, ifsc_code, upi_id, joining_date, trade, department, skill_level,
        daily_wage, overtime_rate, current_site_id, status, photo, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
              COALESCE($19, CURRENT_DATE::text), $20, $21, $22, $23, $24, $25, $26, $27, $28)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        father_name = EXCLUDED.father_name,
        gender = EXCLUDED.gender,
        dob = EXCLUDED.dob,
        phone = EXCLUDED.phone,
        emergency_contact = EXCLUDED.emergency_contact,
        address = EXCLUDED.address,
        village = EXCLUDED.village,
        district = EXCLUDED.district,
        state = EXCLUDED.state,
        pin_code = EXCLUDED.pin_code,
        aadhaar = EXCLUDED.aadhaar,
        pan = EXCLUDED.pan,
        bank_name = EXCLUDED.bank_name,
        account_number = EXCLUDED.account_number,
        ifsc_code = EXCLUDED.ifsc_code,
        upi_id = EXCLUDED.upi_id,
        trade = EXCLUDED.trade,
        department = EXCLUDED.department,
        skill_level = EXCLUDED.skill_level,
        daily_wage = EXCLUDED.daily_wage,
        overtime_rate = EXCLUDED.overtime_rate,
        current_site_id = EXCLUDED.current_site_id,
        status = EXCLUDED.status,
        photo = EXCLUDED.photo,
        notes = EXCLUDED.notes;
    `, [
      w.id, w.name, w.father_name, w.gender, w.dob, w.phone, w.emergency_contact,
      w.address, w.village, w.district, w.state, w.pin_code, w.aadhaar, w.pan,
      w.bank_name, w.account_number, w.ifsc_code, w.upi_id, w.joining_date, w.trade, w.department, w.skill_level,
      w.daily_wage, w.overtime_rate, w.current_site_id, w.status, w.photo, w.notes
    ]);
  }

  async countActiveWorkers(siteId: string): Promise<number> {
    const result = await this.query(`
      SELECT COUNT(id)::int as count FROM ${this.tableName} 
      WHERE current_site_id = $1 AND status = 'Active'
    `, [siteId]);
    return result.rows[0]?.count || 0;
  }
}
