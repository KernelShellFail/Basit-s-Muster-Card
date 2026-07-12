import { BaseRepository } from './BaseRepository';

export interface NotificationEntity {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export class NotificationRepository extends BaseRepository<NotificationEntity> {
  constructor() {
    super('notifications');
  }

  async markAllAsRead(): Promise<void> {
    await this.query(`UPDATE ${this.tableName} SET read = TRUE`);
  }

  async findOrderedByCreatedAt(): Promise<NotificationEntity[]> {
    const result = await this.query(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
    return result.rows;
  }
}
