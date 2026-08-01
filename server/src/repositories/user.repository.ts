import { BaseRepository } from './BaseRepository';

export interface User {
  uid: string;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  role: string;
  site_id?: string;
  organization_id?: string;
  password?: string;
  worker_id?: string;
  photo?: string;
}

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findAllByOrg(orgId: string): Promise<User[]> {
    const result = await this.query(
      `SELECT * FROM ${this.tableName} WHERE organization_id = $1 ORDER BY name ASC`,
      [orgId]
    );
    return result.rows;
  }

  async findByUid(uid: string): Promise<User | null> {
    const result = await this.query(`SELECT * FROM ${this.tableName} WHERE uid = $1`, [uid]);
    return result.rows[0] || null;
  }

  async findByUidAndOrg(uid: string, orgId: string): Promise<User | null> {
    const result = await this.query(
      `SELECT * FROM ${this.tableName} WHERE uid = $1 AND organization_id = $2`,
      [uid, orgId]
    );
    return result.rows[0] || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await this.query(
      `SELECT * FROM ${this.tableName} WHERE LOWER(username) = LOWER($1)`,
      [username]
    );
    return result.rows[0] || null;
  }

  async findByUsernameInOrg(username: string, orgId: string): Promise<User | null> {
    const result = await this.query(
      `SELECT * FROM ${this.tableName} WHERE LOWER(username) = LOWER($1) AND organization_id = $2`,
      [username, orgId]
    );
    return result.rows[0] || null;
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const result = await this.query(`
      SELECT * FROM ${this.tableName} 
      WHERE email = $1 OR phone = $1 OR uid = $1 OR worker_id = $1 OR username = $1
    `, [identifier]);
    return result.rows[0] || null;
  }

  async deleteByUid(uid: string): Promise<boolean> {
    const result = await this.query(`DELETE FROM ${this.tableName} WHERE uid = $1 RETURNING uid`, [uid]);
    return (result.rowCount ?? 0) > 0;
  }

  async deleteByUidAndOrg(uid: string, orgId: string): Promise<boolean> {
    const result = await this.query(
      `DELETE FROM ${this.tableName} WHERE uid = $1 AND organization_id = $2 RETURNING uid`,
      [uid, orgId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async save(user: User): Promise<void> {
    const userExist = await this.findByUid(user.uid);
    if (userExist) {
      await this.query(`
        UPDATE ${this.tableName} SET
          name = $2,
          username = $3,
          email = $4,
          phone = $5,
          role = $6,
          site_id = $7,
          worker_id = $9,
          photo = $10,
          password = COALESCE($11, password)
        WHERE uid = $1 AND organization_id = $8;
      `, [user.uid, user.name, user.username || null, user.email, user.phone, user.role, user.site_id, user.organization_id || userExist.organization_id, user.worker_id || null, user.photo || null, user.password || null]);
    } else {
      await this.query(`
        INSERT INTO ${this.tableName} (uid, name, username, email, phone, role, site_id, organization_id, photo, password, worker_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
      `, [user.uid, user.name, user.username || null, user.email, user.phone, user.role, user.site_id, user.organization_id, user.photo || null, user.password || null, user.worker_id || null]);
    }
  }
}
