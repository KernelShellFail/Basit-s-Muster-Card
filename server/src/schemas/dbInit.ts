import { pool, hashPassword } from '../db';

export const initSchema = async () => {
  const client = pool; // Directly use pool since queries are simple and pool is a pool of clients.
  try {
    // 1. Organization Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        logo TEXT,
        gst_number VARCHAR(50),
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        owner_id VARCHAR(50)
      );
    `);

    // 2. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        uid VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        role VARCHAR(20) NOT NULL,
        site_id VARCHAR(50),
        organization_id VARCHAR(50),
        password TEXT,
        worker_id VARCHAR(50)
      );
    `);

    // 3. Sites Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sites (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        gps_coordinates VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        supervisor_id VARCHAR(50),
        workers_count INTEGER DEFAULT 0
      );
    `);

    // 4. Workers Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS workers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        father_name VARCHAR(255),
        gender VARCHAR(20),
        dob VARCHAR(20),
        phone VARCHAR(50),
        emergency_contact VARCHAR(50),
        address TEXT,
        village VARCHAR(100),
        district VARCHAR(100),
        state VARCHAR(100),
        pin_code VARCHAR(20),
        aadhaar VARCHAR(50),
        pan VARCHAR(50),
        bank_name VARCHAR(255),
        account_number VARCHAR(50),
        ifsc_code VARCHAR(20),
        upi_id VARCHAR(100),
        joining_date VARCHAR(20),
        trade VARCHAR(50),
        department VARCHAR(50),
        skill_level VARCHAR(50),
        daily_wage DECIMAL(10,2) DEFAULT 0,
        overtime_rate DECIMAL(10,2) DEFAULT 0,
        current_site_id VARCHAR(50),
        status VARCHAR(20) DEFAULT 'Active',
        photo TEXT,
        notes TEXT
      );
    `);

    // 5. Attendance Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR(50) PRIMARY KEY,
        worker_id VARCHAR(50) NOT NULL,
        date VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        is_night_shift BOOLEAN DEFAULT false,
        overtime_hours DECIMAL(4,2) DEFAULT 0,
        time_in VARCHAR(20),
        time_out VARCHAR(20),
        gps_coordinates VARCHAR(100),
        photo_proof TEXT,
        supervisor_id VARCHAR(50),
        site_id VARCHAR(50) NOT NULL,
        remarks TEXT
      );
    `);

    // 6. Payments Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(50) PRIMARY KEY,
        worker_id VARCHAR(50) NOT NULL,
        worker_name VARCHAR(255),
        date VARCHAR(20) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_type VARCHAR(20) NOT NULL,
        reference_number VARCHAR(100),
        type VARCHAR(20) NOT NULL,
        worker_signature TEXT,
        supervisor_signature TEXT,
        notes TEXT
      );
    `);

    // 7. Leaves Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS leaves (
        id VARCHAR(50) PRIMARY KEY,
        worker_id VARCHAR(50) NOT NULL,
        worker_name VARCHAR(255),
        leave_type VARCHAR(20) NOT NULL,
        start_date VARCHAR(20) NOT NULL,
        end_date VARCHAR(20) NOT NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'Pending',
        comment TEXT,
        created_at VARCHAR(30) NOT NULL
      );
    `);

    // 8. Notifications Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) NOT NULL,
        "read" BOOLEAN DEFAULT false,
        created_at VARCHAR(30) NOT NULL
      );
    `);

    // 9. Chat Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat (
        id VARCHAR(50) PRIMARY KEY,
        site_id VARCHAR(50) NOT NULL,
        sender_id VARCHAR(50) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_role VARCHAR(20) NOT NULL,
        text TEXT,
        image_url TEXT,
        created_at VARCHAR(30) NOT NULL
      );
    `);

    // 10. Labour Submissions (Verification claims by labour)
    await client.query(`
      CREATE TABLE IF NOT EXISTS labour_submissions (
        id VARCHAR(50) PRIMARY KEY,
        worker_id VARCHAR(50) NOT NULL,
        date VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        is_night_shift BOOLEAN DEFAULT false,
        overtime_hours DECIMAL(4,2) DEFAULT 0,
        time_in VARCHAR(20),
        time_out VARCHAR(20),
        remarks TEXT,
        created_at VARCHAR(30) NOT NULL,
        CONSTRAINT unique_worker_date UNIQUE (worker_id, date)
      );
    `);

    console.log('Database schema synchronized and initialized successfully.');

    // Seed Demo Data if Users Table is empty
    const { rowCount } = await client.query('SELECT 1 FROM users LIMIT 1');
    if (rowCount === 0) {
      console.log('Seeding demo data...');
      
      const orgId = 'org-demo';
      const siteId = 'site-01';
      const defaultOwnerUid = 'usr-owner-demo';
      const defaultSuperUid = 'usr-super-demo';
      
      // We must require hashPassword from db, let's use a dynamic import or require here?
      // Wait, hashPassword is in '../db'. We can import it at the top of dbInit.ts
      
      await client.query(`
        INSERT INTO organizations (id, name) VALUES ('org-demo', 'Demo Corporation');
      `);
      
      await client.query(`
        INSERT INTO sites (id, name, status, supervisor_id) VALUES ('site-01', 'HQ Site', 'active', 'usr-super-demo');
      `);
      
      const ownerHash = hashPassword('owner123');
      const superHash = hashPassword('super123');
      const labourHash = hashPassword('labour123');

      await client.query(`
        INSERT INTO users (uid, name, email, phone, role, site_id, organization_id, password) 
        VALUES 
        ('usr-owner-demo', 'Demo Owner', 'owner@mustermate.com', '1234567890', 'owner', 'site-01', 'org-demo', $1),
        ('usr-super-demo', 'Demo Supervisor', 'satish@mustermate.com', '0987654321', 'supervisor', 'site-01', 'org-demo', $2),
        ('WRK-2026-001', 'Demo Labour', 'labour@mustermate.com', '1122334455', 'labour', 'site-01', 'org-demo', $3)
      `, [ownerHash, superHash, labourHash]);

      console.log('Demo users inserted successfully.');
    }
  } catch (error) {
    console.error('Error initializing schema:', error);
  }
};
