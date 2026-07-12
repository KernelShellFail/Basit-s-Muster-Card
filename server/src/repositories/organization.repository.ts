import { BaseRepository } from './BaseRepository';

export interface Organization {
  id: string;
  name: string;
  logo?: string;
  gst_number?: string;
  address?: string;
  phone?: string;
  email?: string;
  owner_id?: string;
}

export class OrganizationRepository extends BaseRepository<Organization> {
  constructor() {
    super('organizations');
  }

  async findFirst(): Promise<Organization | null> {
    const result = await this.query(`SELECT * FROM ${this.tableName} LIMIT 1`);
    return result.rows[0] || null;
  }

  async save(org: Organization): Promise<void> {
    await this.query(`
      INSERT INTO ${this.tableName} (id, name, logo, gst_number, address, phone, email, owner_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        logo = EXCLUDED.logo,
        gst_number = EXCLUDED.gst_number,
        address = EXCLUDED.address,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email;
    `, [org.id, org.name, org.logo, org.gst_number, org.address, org.phone, org.email, org.owner_id]);
  }
}
