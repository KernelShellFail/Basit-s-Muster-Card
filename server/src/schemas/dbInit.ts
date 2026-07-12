import { pool } from '../db';

export const initSchema = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

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

    // Ensure columns added dynamically if table existed previously
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS worker_id VARCHAR(50);');

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
        uan VARCHAR(50),
        esic VARCHAR(50),
        category VARCHAR(50),
        site_id VARCHAR(50),
        contractor_id VARCHAR(50),
        wage_rate DECIMAL(10,2) DEFAULT 0,
        overtime_rate DECIMAL(10,2) DEFAULT 0,
        shift VARCHAR(20),
        status VARCHAR(20) DEFAULT 'active',
        photo TEXT,
        join_date VARCHAR(20),
        skill_level VARCHAR(50),
        pin VARCHAR(4)
      );
    `);

    // Ensure PIN is added
    await client.query('ALTER TABLE workers ADD COLUMN IF NOT EXISTS pin VARCHAR(4);');

    // 5. Attendance Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR(50) PRIMARY KEY,
        worker_id VARCHAR(50) NOT NULL,
        site_id VARCHAR(50) NOT NULL,
        date VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        time_in VARCHAR(20),
        time_out VARCHAR(20),
        overtime_hours DECIMAL(4,2) DEFAULT 0,
        supervisor_id VARCHAR(50),
        gps_location VARCHAR(100),
        notes TEXT,
        verification_method VARCHAR(20)
      );
    `);

    // 6. Payments Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(50) PRIMARY KEY,
        worker_id VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        date VARCHAR(20) NOT NULL,
        type VARCHAR(20) NOT NULL,
        payment_mode VARCHAR(20),
        reference_no VARCHAR(100),
        status VARCHAR(20) DEFAULT 'completed',
        period_start VARCHAR(20),
        period_end VARCHAR(20),
        notes TEXT,
        deductions DECIMAL(10,2) DEFAULT 0,
        bonuses DECIMAL(10,2) DEFAULT 0
      );
    `);

    // 7. Leaves Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS leaves (
        id VARCHAR(50) PRIMARY KEY,
        worker_id VARCHAR(50) NOT NULL,
        start_date VARCHAR(20) NOT NULL,
        end_date VARCHAR(20) NOT NULL,
        type VARCHAR(20) NOT NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        approved_by VARCHAR(50)
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
        sender_id VARCHAR(50) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        site_id VARCHAR(50) NOT NULL,
        text TEXT,
        image_url TEXT,
        timestamp VARCHAR(30) NOT NULL
      );
    `);

    // 10. Labour Submissions (Pending verifications)
    await client.query(`
      CREATE TABLE IF NOT EXISTS labour_submissions (
        id VARCHAR(50) PRIMARY KEY,
        worker_id VARCHAR(50) NOT NULL,
        site_id VARCHAR(50) NOT NULL,
        date VARCHAR(20) NOT NULL,
        type VARCHAR(20) NOT NULL,
        timestamp VARCHAR(30) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        reviewed_by VARCHAR(50)
      );
    `);

    await client.query('COMMIT');
    console.log('Database schema initialized successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing schema:', error);
  } finally {
    client.release();
  }
};
