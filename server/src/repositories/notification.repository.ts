import { BaseRepository } from './BaseRepository';

export interface NotificationEntity {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
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
}
