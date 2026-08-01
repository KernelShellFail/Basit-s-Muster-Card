import { pool } from '../db';
import { config } from '../config';
import { seedDemo } from './seedDemo';

interface ColumnDef {
  name: string;
  type: string;
}

// Single source of truth for the schema. Used both to CREATE new tables and to
// reconcile (ADD COLUMN) existing tables that may predate newer columns.
const TABLES: Record<string, ColumnDef[]> = {
  organizations: [
    { name: 'id', type: 'VARCHAR(50) PRIMARY KEY' },
    { name: 'name', type: 'VARCHAR(255) NOT NULL' },
    { name: 'logo', type: 'TEXT' },
    { name: 'gst_number', type: 'VARCHAR(50)' },
    { name: 'address', type: 'TEXT' },
    { name: 'phone', type: 'VARCHAR(50)' },
    { name: 'email', type: 'VARCHAR(255)' },
    { name: 'owner_id', type: 'VARCHAR(50)' },
  ],
  users: [
    { name: 'uid', type: 'VARCHAR(50) PRIMARY KEY' },
    { name: 'name', type: 'VARCHAR(255) NOT NULL' },
    { name: 'username', type: 'VARCHAR(100)' },
    { name: 'email', type: 'VARCHAR(255)' },
    { name: 'phone', type: 'VARCHAR(50)' },
    { name: 'role', type: 'VARCHAR(20) NOT NULL' },
    { name: 'site_id', type: 'VARCHAR(50)' },
    { name: 'organization_id', type: 'VARCHAR(50)' },
    { name: 'password', type: 'TEXT' },
    { name: 'worker_id', type: 'VARCHAR(50)' },
    { name: 'photo', type: 'TEXT' },
  ],
  sites: [
    { name: 'id', type: 'VARCHAR(50) PRIMARY KEY' },
    { name: 'name', type: 'VARCHAR(255) NOT NULL' },
    { name: 'address', type: 'TEXT' },
    { name: 'gps_coordinates', type: 'VARCHAR(100)' },
    { name: 'status', type: 'VARCHAR(20) DEFAULT \'active\'' },
    { name: 'supervisor_id', type: 'VARCHAR(50)' },
    { name: 'workers_count', type: 'INTEGER DEFAULT 0' },
    { name: 'organization_id', type: 'VARCHAR(50)' },
  ],
  workers: [
    { name: 'id', type: 'VARCHAR(50) PRIMARY KEY' },
    { name: 'name', type: 'VARCHAR(255) NOT NULL' },
    { name: 'father_name', type: 'VARCHAR(255)' },
    { name: 'gender', type: 'VARCHAR(20)' },
    { name: 'dob', type: 'VARCHAR(20)' },
    { name: 'phone', type: 'VARCHAR(50)' },
    { name: 'emergency_contact', type: 'VARCHAR(50)' },
    { name: 'address', type: 'TEXT' },
    { name: 'village', type: 'VARCHAR(100)' },
    { name: 'district', type: 'VARCHAR(100)' },
    { name: 'state', type: 'VARCHAR(100)' },
    { name: 'pin_code', type: 'VARCHAR(20)' },
    { name: 'aadhaar', type: 'VARCHAR(50)' },
    { name: 'pan', type: 'VARCHAR(50)' },
    { name: 'bank_name', type: 'VARCHAR(255)' },
    { name: 'account_number', type: 'VARCHAR(50)' },
    { name: 'ifsc_code', type: 'VARCHAR(20)' },
    { name: 'upi_id', type: 'VARCHAR(100)' },
    { name: 'joining_date', type: 'VARCHAR(20)' },
    { name: 'trade', type: 'VARCHAR(50)' },
    { name: 'department', type: 'VARCHAR(50)' },
    { name: 'skill_level', type: 'VARCHAR(50)' },
    { name: 'daily_wage', type: 'DECIMAL(10,2) DEFAULT 0' },
    { name: 'overtime_rate', type: 'DECIMAL(10,2) DEFAULT 0' },
    { name: 'current_site_id', type: 'VARCHAR(50)' },
    { name: 'status', type: 'VARCHAR(20) DEFAULT \'Active\'' },
    { name: 'photo', type: 'TEXT' },
    { name: 'notes', type: 'TEXT' },
    { name: 'pin', type: 'VARCHAR(20)' },
    { name: 'organization_id', type: 'VARCHAR(50)' },
  ],
  attendance: [
    { name: 'id', type: 'VARCHAR(50) PRIMARY KEY' },
    { name: 'worker_id', type: 'VARCHAR(50) NOT NULL' },
    { name: 'date', type: 'VARCHAR(20) NOT NULL' },
    { name: 'status', type: 'VARCHAR(20) NOT NULL' },
    { name: 'is_night_shift', type: 'BOOLEAN DEFAULT false' },
    { name: 'overtime_hours', type: 'DECIMAL(4,2) DEFAULT 0' },
    { name: 'time_in', type: 'VARCHAR(20)' },
    { name: 'time_out', type: 'VARCHAR(20)' },
    { name: 'gps_coordinates', type: 'VARCHAR(100)' },
    { name: 'photo_proof', type: 'TEXT' },
    { name: 'supervisor_id', type: 'VARCHAR(50)' },
    { name: 'site_id', type: 'VARCHAR(50) NOT NULL' },
    { name: 'remarks', type: 'TEXT' },
    { name: 'organization_id', type: 'VARCHAR(50)' },
  ],
  payments: [
    { name: 'id', type: 'VARCHAR(50) PRIMARY KEY' },
    { name: 'worker_id', type: 'VARCHAR(50) NOT NULL' },
    { name: 'worker_name', type: 'VARCHAR(255)' },
    { name: 'date', type: 'VARCHAR(20) NOT NULL' },
    { name: 'amount', type: 'DECIMAL(10,2) NOT NULL' },
    { name: 'payment_type', type: 'VARCHAR(20) NOT NULL' },
    { name: 'reference_number', type: 'VARCHAR(100)' },
    { name: 'type', type: 'VARCHAR(20) NOT NULL' },
    { name: 'worker_signature', type: 'TEXT' },
    { name: 'supervisor_signature', type: 'TEXT' },
    { name: 'notes', type: 'TEXT' },
    { name: 'organization_id', type: 'VARCHAR(50)' },
  ],
  leaves: [
    { name: 'id', type: 'VARCHAR(50) PRIMARY KEY' },
    { name: 'worker_id', type: 'VARCHAR(50) NOT NULL' },
    { name: 'worker_name', type: 'VARCHAR(255)' },
    { name: 'leave_type', type: 'VARCHAR(20) NOT NULL' },
    { name: 'start_date', type: 'VARCHAR(20) NOT NULL' },
    { name: 'end_date', type: 'VARCHAR(20) NOT NULL' },
    { name: 'reason', type: 'TEXT' },
    { name: 'status', type: 'VARCHAR(20) DEFAULT \'Pending\'' },
    { name: 'comment', type: 'TEXT' },
    { name: 'created_at', type: 'VARCHAR(30) NOT NULL' },
    { name: 'organization_id', type: 'VARCHAR(50)' },
  ],
  notifications: [
    { name: 'id', type: 'VARCHAR(50) PRIMARY KEY' },
    { name: 'title', type: 'VARCHAR(255) NOT NULL' },
    { name: 'message', type: 'TEXT NOT NULL' },
    { name: 'type', type: 'VARCHAR(20) NOT NULL' },
    { name: 'read', type: 'BOOLEAN DEFAULT false' },
    { name: 'link', type: 'VARCHAR(255)' },
    { name: 'created_at', type: 'VARCHAR(30) NOT NULL' },
    { name: 'organization_id', type: 'VARCHAR(50)' },
  ],
  chat: [
    { name: 'id', type: 'VARCHAR(50) PRIMARY KEY' },
    { name: 'site_id', type: 'VARCHAR(50) NOT NULL' },
    { name: 'sender_id', type: 'VARCHAR(50) NOT NULL' },
    { name: 'sender_name', type: 'VARCHAR(255) NOT NULL' },
    { name: 'sender_role', type: 'VARCHAR(20) NOT NULL' },
    { name: 'text', type: 'TEXT' },
    { name: 'image_url', type: 'TEXT' },
    { name: 'created_at', type: 'VARCHAR(30) NOT NULL' },
    { name: 'organization_id', type: 'VARCHAR(50)' },
  ],
  labour_submissions: [
    { name: 'id', type: 'VARCHAR(50) PRIMARY KEY' },
    { name: 'worker_id', type: 'VARCHAR(50) NOT NULL' },
    { name: 'date', type: 'VARCHAR(20) NOT NULL' },
    { name: 'status', type: 'VARCHAR(20) NOT NULL' },
    { name: 'is_night_shift', type: 'BOOLEAN DEFAULT false' },
    { name: 'overtime_hours', type: 'DECIMAL(4,2) DEFAULT 0' },
    { name: 'time_in', type: 'VARCHAR(20)' },
    { name: 'time_out', type: 'VARCHAR(20)' },
    { name: 'remarks', type: 'TEXT' },
    { name: 'created_at', type: 'VARCHAR(30) NOT NULL' },
    { name: 'organization_id', type: 'VARCHAR(50)' },
  ],
};

const quoteIdentifier = (name: string) => (name === 'read' ? '"read"' : name);

const createTable = (table: string, columns: ColumnDef[]) => {
  const defs = columns.map(c => `${quoteIdentifier(c.name)} ${c.type}`);
  return pool.query(`CREATE TABLE IF NOT EXISTS ${table} (${defs.join(', ')})`);
};

const ensureColumns = async () => {
  for (const [table, columns] of Object.entries(TABLES)) {
    const { rows } = await pool.query(
      'SELECT column_name FROM information_schema.columns WHERE table_name = $1',
      [table]
    );
    const existing = new Set(rows.map((r: any) => r.column_name));
    for (const col of columns) {
      if (existing.has(col.name)) continue;
      await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${quoteIdentifier(col.name)} ${col.type}`);
    }
  }
};

// Backfill organization_id for rows created before multi-tenancy was introduced.
// Legacy rows are mapped via their supervisor/worker/site relationship, falling back to the configured demo org.
const backfillOrganizationIds = async () => {
  const fallbackOrg = config.backfillFallbackOrg;
  await pool.query(`
    UPDATE sites s
    SET organization_id = u.organization_id
    FROM users u
    WHERE s.organization_id IS NULL
      AND s.supervisor_id IS NOT NULL
      AND s.supervisor_id <> ''
      AND s.supervisor_id = u.uid
  `);
  await pool.query(`UPDATE sites SET organization_id = $1 WHERE organization_id IS NULL`, [fallbackOrg]);

  await pool.query(`
    UPDATE workers w
    SET organization_id = COALESCE(s.organization_id, $1)
    FROM sites s
    WHERE w.organization_id IS NULL AND w.current_site_id = s.id
  `, [fallbackOrg]);
  await pool.query(`UPDATE workers SET organization_id = $1 WHERE organization_id IS NULL`, [fallbackOrg]);

  await pool.query(`
    UPDATE attendance a
    SET organization_id = COALESCE(s.organization_id, $1)
    FROM sites s
    WHERE a.organization_id IS NULL AND a.site_id = s.id
  `, [fallbackOrg]);
  await pool.query(`UPDATE attendance SET organization_id = $1 WHERE organization_id IS NULL`, [fallbackOrg]);

  await pool.query(`
    UPDATE chat c
    SET organization_id = COALESCE(s.organization_id, $1)
    FROM sites s
    WHERE c.organization_id IS NULL AND c.site_id = s.id
  `, [fallbackOrg]);
  await pool.query(`UPDATE chat SET organization_id = $1 WHERE organization_id IS NULL`, [fallbackOrg]);

  await pool.query(`
    UPDATE payments p
    SET organization_id = COALESCE(w.organization_id, $1)
    FROM workers w
    WHERE p.organization_id IS NULL AND p.worker_id = w.id
  `, [fallbackOrg]);
  await pool.query(`UPDATE payments SET organization_id = $1 WHERE organization_id IS NULL`, [fallbackOrg]);

  await pool.query(`
    UPDATE leaves l
    SET organization_id = COALESCE(w.organization_id, $1)
    FROM workers w
    WHERE l.organization_id IS NULL AND l.worker_id = w.id
  `, [fallbackOrg]);
  await pool.query(`UPDATE leaves SET organization_id = $1 WHERE organization_id IS NULL`, [fallbackOrg]);

  await pool.query(`
    UPDATE labour_submissions ls
    SET organization_id = COALESCE(w.organization_id, $1)
    FROM workers w
    WHERE ls.organization_id IS NULL AND ls.worker_id = w.id
  `, [fallbackOrg]);
  await pool.query(`UPDATE labour_submissions SET organization_id = $1 WHERE organization_id IS NULL`, [fallbackOrg]);

  await pool.query(`UPDATE notifications SET organization_id = $1 WHERE organization_id IS NULL`, [fallbackOrg]);
};

export const initSchema = async () => {
  try {
    for (const [table, columns] of Object.entries(TABLES)) {
      await createTable(table, columns);
    }

    // Add columns that may be missing from tables created before this schema definition.
    await ensureColumns();
    await backfillOrganizationIds();

    console.log('Database schema synchronized and initialized successfully.');

    // Refresh demo data (idempotent) when enabled.
    if (config.demo.enabled) {
      await seedDemo();
    }
  } catch (error) {
    console.error('Error initializing schema:', error);
    throw error;
  }
};
