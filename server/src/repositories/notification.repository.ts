import { BaseRepository } from './BaseRepository';

export interface NotificationEntity {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  created_at: string;
  organization_id?: string;
}

export class NotificationRepository extends BaseRepository<NotificationEntity> {
  constructor() {
    super('notifications');
  }

  async findAllByOrg(orgId: string): Promise<NotificationEntity[]> {
    const result = await this.query(
      `SELECT * FROM ${this.tableName} WHERE organization_id = $1 ORDER BY created_at DESC`,
      [orgId]
    );
    return result.rows;
  }

  async markAllAsRead(orgId: string): Promise<void> {
    await this.query(`UPDATE ${this.tableName} SET read = TRUE WHERE organization_id = $1`, [orgId]);
  }

  async markAsRead(id: string, orgId: string): Promise<void> {
    await this.query(
      `UPDATE ${this.tableName} SET read = TRUE WHERE id = $1 AND organization_id = $2`,
      [id, orgId]
    );
  }

  async create(entity: NotificationEntity): Promise<void> {
    await this.query(
      `INSERT INTO ${this.tableName} (id, title, message, type, read, link, created_at, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [entity.id, entity.title, entity.message, entity.type, entity.read, entity.link || null, entity.created_at, entity.organization_id || null]
    );
  }
}
