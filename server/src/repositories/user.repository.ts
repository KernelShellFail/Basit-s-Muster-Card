import { BaseRepository } from './BaseRepository';

export interface User {
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  site_id?: string;
  organization_id?: string;
  password?: string;
  worker_id?: string;
}

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findByUid(uid: string): Promise<User | null> {
    const result = await this.query(`SELECT * FROM ${this.tableName} WHERE uid = $1`, [uid]);
    return result.rows[0] || null;
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const result = await this.query(`
      SELECT * FROM ${this.tableName} 
      WHERE email = $1 OR phone = $1 OR uid = $1 OR worker_id = $1
    `, [identifier]);
    return result.rows[0] || null;
  }

  async deleteByUid(uid: string): Promise<boolean> {
    const result = await this.query(`DELETE FROM ${this.tableName} WHERE uid = $1 RETURNING uid`, [uid]);
    return (result.rowCount ?? 0) > 0;
  }

  async save(user: User): Promise<void> {
    const userExist = await this.findByUid(user.uid);
    if (userExist) {
      await this.query(`
        UPDATE ${this.tableName} SET
          name = $2,
          email = $3,
          phone = $4,
          role = $5,
          site_id = $6,
          organization_id = $7,
          worker_id = $8,
          password = COALESCE($9, password)
        WHERE uid = $1;
      `, [user.uid, user.name, user.email, user.phone, user.role, user.site_id, user.organization_id || 'org-101', user.worker_id || null, user.password || null]);
    } else {
      await this.query(`
        INSERT INTO ${this.tableName} (uid, name, email, phone, role, site_id, organization_id, password, worker_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `, [user.uid, user.name, user.email, user.phone, user.role, user.site_id, user.organization_id || 'org-101', user.password || null, user.worker_id || null]);
    }
  }
}
