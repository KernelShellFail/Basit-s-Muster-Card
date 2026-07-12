import { BaseRepository } from './BaseRepository';

export interface ChatMessageEntity {
  id: string;
  site_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  text?: string;
  image_url?: string;
  created_at: string;
}

export class ChatRepository extends BaseRepository<ChatMessageEntity> {
  constructor() {
    super('chat');
  }

  async save(c: ChatMessageEntity): Promise<void> {
    await this.query(`
      INSERT INTO ${this.tableName} (id, site_id, sender_id, sender_name, sender_role, text, image_url, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO NOTHING;
    `, [c.id, c.site_id, c.sender_id, c.sender_name, c.sender_role, c.text, c.image_url, c.created_at]);
  }

  async findBySiteId(siteId: string): Promise<ChatMessageEntity[]> {
    const result = await this.query(`
      SELECT * FROM ${this.tableName}
      WHERE site_id = $1
      ORDER BY created_at ASC
    `, [siteId]);
    return result.rows;
  }
}
