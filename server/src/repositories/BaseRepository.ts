import { pool } from '../db';
import { PoolClient, QueryResult } from 'pg';

export abstract class BaseRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected async query<R = any>(text: string, params?: any[]): Promise<QueryResult<R>> {
    const client = await pool.connect();
    try {
      return await client.query<R>(text, params);
    } finally {
      client.release();
    }
  }

  async findAll(): Promise<T[]> {
    const result = await this.query(`SELECT * FROM ${this.tableName}`);
    return result.rows;
  }

  async findById(id: string): Promise<T | null> {
    const result = await this.query(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.query(`DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
