import { BaseRepository } from './BaseRepository';

export interface SiteEntity {
  id: string;
  name: string;
  address?: string;
  gps_coordinates?: string;
  status: string;
  supervisor_id?: string;
  workers_count?: number;
  organization_id?: string;
}

export class SiteRepository extends BaseRepository<SiteEntity> {
  constructor() {
    super('sites');
  }

  async findAllByOrg(orgId: string): Promise<SiteEntity[]> {
    const result = await this.query(
      `SELECT * FROM ${this.tableName} WHERE organization_id = $1 ORDER BY name ASC`,
      [orgId]
    );
    return result.rows;
  }

  async findByIdAndOrg(id: string, orgId: string): Promise<SiteEntity | null> {
    const result = await this.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1 AND organization_id = $2`,
      [id, orgId]
    );
    return result.rows[0] || null;
  }

  async save(s: SiteEntity): Promise<void> {
    await this.query(`
      INSERT INTO ${this.tableName} (id, name, address, gps_coordinates, status, supervisor_id, workers_count, organization_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        gps_coordinates = EXCLUDED.gps_coordinates,
        status = EXCLUDED.status,
        supervisor_id = EXCLUDED.supervisor_id,
        workers_count = EXCLUDED.workers_count
      WHERE sites.organization_id = EXCLUDED.organization_id;
    `, [s.id, s.name, s.address, s.gps_coordinates, s.status, s.supervisor_id, s.workers_count || 0, s.organization_id]);
  }

  async updateWorkersCount(siteId: string, count: number): Promise<void> {
    await this.query(`
      UPDATE ${this.tableName}
      SET workers_count = $2
      WHERE id = $1
    `, [siteId, count]);
  }

  async deleteSiteCascade(id: string, orgId: string): Promise<boolean> {
    await this.query('UPDATE workers SET current_site_id = NULL WHERE current_site_id = $1 AND organization_id = $2', [id, orgId]);
    await this.query('UPDATE users SET site_id = NULL WHERE site_id = $1 AND organization_id = $2', [id, orgId]);
    return this.deleteByIdAndOrg(id, orgId);
  }
}
