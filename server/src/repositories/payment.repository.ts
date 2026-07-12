import { BaseRepository } from './BaseRepository';

export interface PaymentEntity {
  id: string;
  worker_id: string;
  worker_name?: string;
  date: string;
  amount: number;
  payment_type: string;
  reference_number?: string;
  type: string;
  worker_signature?: string;
  supervisor_signature?: string;
  notes?: string;
}

export class PaymentRepository extends BaseRepository<PaymentEntity> {
  constructor() {
    super('payments');
  }

  async save(p: PaymentEntity): Promise<void> {
    await this.query(`
      INSERT INTO ${this.tableName} (
        id, worker_id, worker_name, date, amount, payment_type, reference_number, type, worker_signature, supervisor_signature, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        worker_name = EXCLUDED.worker_name,
        date = EXCLUDED.date,
        amount = EXCLUDED.amount,
        payment_type = EXCLUDED.payment_type,
        reference_number = EXCLUDED.reference_number,
        type = EXCLUDED.type,
        worker_signature = EXCLUDED.worker_signature,
        supervisor_signature = EXCLUDED.supervisor_signature,
        notes = EXCLUDED.notes;
    `, [
      p.id, p.worker_id, p.worker_name, p.date, p.amount, p.payment_type, p.reference_number, p.type, p.worker_signature, p.supervisor_signature, p.notes
    ]);
  }

  async findOrderedByDate(): Promise<PaymentEntity[]> {
    const result = await this.query(`SELECT * FROM ${this.tableName} ORDER BY date DESC, id DESC`);
    return result.rows;
  }
}
