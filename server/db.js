import pg from 'pg';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const { Pool } = pg;

export const hashPassword = (password) => {
  if (!password) return '';
  return crypto.createHash('sha256').update(password).digest('hex');
};

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mustermate',
  password: process.env.DB_PASSWORD === 'YOUR_POSTGRESQL_PASSWORD_HERE' ? '' : process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Test connection
pool.on('connect', () => {
  console.log('PostgreSQL database pool connected.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Initialization Query
const initSchema = async () => {
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
        account_number VARCHAR(100),
        ifsc_code VARCHAR(50),
        upi_id VARCHAR(100),
        joining_date VARCHAR(20),
        trade VARCHAR(50),
        department VARCHAR(50),
        skill_level VARCHAR(50),
        daily_wage NUMERIC DEFAULT 0,
        overtime_rate NUMERIC DEFAULT 0,
        current_site_id VARCHAR(50),
        status VARCHAR(20) DEFAULT 'Active',
        photo TEXT,
        notes TEXT
      );
    `);

    // 5. Attendance Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR(100) PRIMARY KEY,
        worker_id VARCHAR(50) REFERENCES workers(id) ON DELETE CASCADE,
        date VARCHAR(20) NOT NULL,
        status VARCHAR(30) NOT NULL,
        is_night_shift BOOLEAN DEFAULT FALSE,
        overtime_hours INTEGER DEFAULT 0,
        time_in VARCHAR(20),
        time_out VARCHAR(20),
        gps_coordinates VARCHAR(100),
        photo_proof TEXT,
        supervisor_id VARCHAR(50),
        site_id VARCHAR(50),
        remarks TEXT
      );
    `);

    // 6. Payments Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(100) PRIMARY KEY,
        worker_id VARCHAR(50) REFERENCES workers(id) ON DELETE CASCADE,
        worker_name VARCHAR(255),
        date VARCHAR(20) NOT NULL,
        amount NUMERIC NOT NULL,
        payment_type VARCHAR(50) NOT NULL,
        reference_number VARCHAR(100),
        type VARCHAR(20) NOT NULL,
        worker_signature TEXT,
        notes TEXT
      );
    `);

    // 7. Leaves Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS leaves (
        id VARCHAR(100) PRIMARY KEY,
        worker_id VARCHAR(50) REFERENCES workers(id) ON DELETE CASCADE,
        worker_name VARCHAR(255),
        leave_type VARCHAR(50) NOT NULL,
        start_date VARCHAR(20) NOT NULL,
        end_date VARCHAR(20) NOT NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'Pending',
        comment TEXT,
        created_at VARCHAR(50)
      );
    `);

    // 8. Chat Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat (
        id VARCHAR(100) PRIMARY KEY,
        site_id VARCHAR(50) NOT NULL,
        sender_id VARCHAR(50) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_role VARCHAR(20) NOT NULL,
        text TEXT NOT NULL,
        image_url TEXT,
        created_at VARCHAR(50) NOT NULL
      );
    `);

    // 9. Notifications Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(20) DEFAULT 'info',
        created_at VARCHAR(50) NOT NULL,
        read BOOLEAN DEFAULT FALSE
      );
    `);

    // 10. Labour Submissions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS labour_submissions (
        id VARCHAR(100) PRIMARY KEY,
        worker_id VARCHAR(50) REFERENCES workers(id) ON DELETE CASCADE,
        date VARCHAR(20) NOT NULL,
        status VARCHAR(30) NOT NULL,
        is_night_shift BOOLEAN DEFAULT FALSE,
        overtime_hours INTEGER DEFAULT 0,
        time_in VARCHAR(20),
        time_out VARCHAR(20),
        remarks TEXT,
        created_at VARCHAR(50) NOT NULL,
        UNIQUE (worker_id, date)
      );
    `);

    await client.query('COMMIT');
    console.log('PostgreSQL database schemas verified/created.');
    
    // Trigger seeder
    await seedDatabase(client);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to initialize database tables:', err);
  } finally {
    client.release();
  }
};

// Seed database with base records
const seedDatabase = async (client) => {
  try {
    // 1. Check if organization seeded
    const orgCheck = await client.query('SELECT id FROM organizations LIMIT 1');
    if (orgCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO organizations (id, name, logo, gst_number, address, phone, email, owner_id)
        VALUES (
          'org-101',
          'MusterMate Buildcon Private Limited',
          'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=150&q=80',
          '27AADCM3241F1ZH',
          '402, Metro Plaza, Sector 15, Vashi, Navi Mumbai, MH, 400703',
          '+91 22 2781 9090',
          'ops@mmbuildcon.com',
          'usr-owner'
        );
      `);
      console.log('Seeded organization profile.');
    }

    // 2. Seed Users
    const usersCheck = await client.query('SELECT uid FROM users LIMIT 1');
    if (usersCheck.rows.length === 0) {
      const users = [
        ['usr-owner', 'Rajesh Singhania', 'owner@mustermate.com', '+91 9876543210', 'owner', 'site-01', 'org-101', hashPassword('owner123'), null],
        ['usr-admin', 'Amit Sharma', 'admin@mustermate.com', '+91 9876543211', 'admin', 'site-01', 'org-101', hashPassword('admin123'), null],
        ['usr-super1', 'Satish Kamble', 'satish@mustermate.com', '+91 9876543212', 'supervisor', 'site-01', 'org-101', hashPassword('super123'), null],
        ['usr-super2', 'Dinesh Patel', 'dinesh@mustermate.com', '+91 9876543213', 'supervisor', 'site-02', 'org-101', hashPassword('super123'), null],
        ['usr-labour', 'Ramesh Yadav', 'ramesh@mustermate.com', '+91 9876543214', 'labour', 'site-01', 'org-101', hashPassword('labour123'), 'WRK-2026-001'],
      ];
      
      for (const u of users) {
        await client.query(`
          INSERT INTO users (uid, name, email, phone, role, site_id, organization_id, password, worker_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `, u);
      }
      console.log('Seeded admin and supervisor users.');
    }

    // Patch passwords of existing seeded users if null (defensive seed fix)
    const pwOwner = hashPassword('owner123');
    const pwAdmin = hashPassword('admin123');
    const pwSuper = hashPassword('super123');
    const pwLabour = hashPassword('labour123');
    
    await client.query(`UPDATE users SET password = $1 WHERE uid = 'usr-owner' AND password IS NULL;`, [pwOwner]);
    await client.query(`UPDATE users SET password = $1 WHERE uid = 'usr-admin' AND password IS NULL;`, [pwAdmin]);
    await client.query(`UPDATE users SET password = $1 WHERE uid IN ('usr-super1', 'usr-super2') AND password IS NULL;`, [pwSuper]);
    await client.query(`UPDATE users SET password = $1, worker_id = 'WRK-2026-001' WHERE uid = 'usr-labour' AND password IS NULL;`, [pwLabour]);

    // 3. Seed Sites
    const sitesCheck = await client.query('SELECT id FROM sites LIMIT 1');
    if (sitesCheck.rows.length === 0) {
      const sites = [
        ['site-01', 'Sector 10 Metro Station Elevated Track', 'Sector 10 Main Road, Kharghar, Navi Mumbai', '19.0264, 73.0725', 'active', 'usr-super1', 4],
        ['site-02', 'Empire Heights Business Tower', 'Plot 42, Bandra Kurla Complex (BKC), Mumbai', '19.0596, 72.8682', 'active', 'usr-super2', 3],
        ['site-03', 'NH-4 Highway Extension Bridge', 'Bridge Section, km 82, Pune-Mumbai Highway', '18.7512, 73.4124', 'on-hold', '', 0],
      ];
      
      for (const s of sites) {
        await client.query(`
          INSERT INTO sites (id, name, address, gps_coordinates, status, supervisor_id, workers_count)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
        `, s);
      }
      console.log('Seeded construction sites.');
    }

    // 4. Seed Workers
    const workersCheck = await client.query('SELECT id FROM workers LIMIT 1');
    if (workersCheck.rows.length === 0) {
      const workers = [
        [
          'WRK-2026-001', 'Ramesh Yadav', 'Harish Yadav', 'Male', '1992-04-12', '+91 9876543214', '+91 9876543290',
          'Room 12, Chawl No. 4, Hanuman Nagar', 'Jaunpur', 'Jaunpur', 'Uttar Pradesh', '222001', '5432-1098-7654', 'BHPY1928K',
          'State Bank of India', '30491827461', 'SBIN0004210', 'ramesh.yadav@oksbi', '2025-01-10', 'Mason', 'Civil', 'Skilled',
          750, 100, 'site-01', 'Active',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
          'Punctual worker. Expert in concrete reinforcement and plastering.'
        ],
        [
          'WRK-2026-002', 'Subhash Gond', 'Ramnath Gond', 'Male', '1995-08-25', '+91 9619283746', '+91 9619283700',
          'Near Old Water Tank, Rabale', 'Gonda', 'Gonda', 'Uttar Pradesh', '271001', '2345-6789-0123', 'CDEZ8734P',
          'Bank of Baroda', '409102938471', 'BARB0VASHIX', 'subhashgond@okaxis', '2025-02-15', 'Helper', 'Civil', 'Helper',
          450, 60, 'site-01', 'Active',
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
          'Good stamina, works hard. Needs close supervision for tasks.'
        ],
        [
          'WRK-2026-003', 'Manpreet Singh', 'Gurdeep Singh', 'Male', '1988-11-02', '+91 9123456789', '+91 9123456700',
          'Flat 101, B-Wing, Guru Nanak Apartments', 'Amritsar', 'Amritsar', 'Punjab', '143001', '9876-5432-1098', 'ZXYW9823M',
          'HDFC Bank', '5010023419284', 'HDFC0001221', 'manpreet.singh@okhdfc', '2025-03-01', 'Welder', 'Civil', 'Highly-Skilled',
          900, 120, 'site-02', 'Active',
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
          'Specialist in structural arch welding and high-altitude ironwork.'
        ],
        [
          'WRK-2026-004', 'Sunita Devi', 'Madan Lal', 'Female', '1990-06-18', '+91 8877665544', '+91 8877665500',
          'Zopadpatti Sector 8, Kopar Khairane', 'Bhabua', 'Kaimur', 'Bihar', '821101', '3456-7890-1234', 'DFGP2930R',
          'Union Bank of India', '601928472918', 'UBIN0542310', 'sunita.devi@okunion', '2025-01-20', 'Helper', 'Civil', 'Helper',
          450, 60, 'site-01', 'Active',
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
          'Handles material moving efficiently. Very honest and regular.'
        ],
        [
          'WRK-2026-005', 'Kiran Kumar', 'Venkataiah Kumar', 'Male', '1993-02-28', '+91 7766554433', '+91 7766554400',
          'Plot 10, Ambedkar Nagar, Airoli', 'Nellore', 'Nellore', 'Andhra Pradesh', '524001', '6789-0123-4567', 'KLMN4832S',
          'State Bank of India', '20394817263', 'SBIN0005912', 'kirankumar@oksbi', '2025-04-05', 'Electrician', 'Electrical', 'Skilled',
          800, 110, 'site-02', 'Active',
          'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80',
          'Expert in wiring, switchboard panels, and reading engineering schematics.'
        ],
        [
          'WRK-2026-006', 'Aniket Sawant', 'Sanjay Sawant', 'Male', '1996-12-05', '+91 8123450987', '+91 8123450900',
          'Room 5, Gupte Chawl, Kalwa', 'Chiplun', 'Ratnagiri', 'Maharashtra', '415605', '7890-1234-5678', 'OPQR9823Z',
          'ICICI Bank', '002105928374', 'ICIC0000021', 'aniketsawant@okicici', '2025-05-10', 'Carpenter', 'Finishing', 'Skilled',
          800, 110, 'site-01', 'Active',
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
          'Formwork carpenter. Fast at assembling scaffold wooden boards.'
        ],
        [
          'WRK-2026-007', 'Balwant Singh', 'Charan Singh', 'Male', '1987-03-14', '+91 9988776655', '+91 9988776600',
          'Camp Sector 2, Nerul', 'Bathinda', 'Bathinda', 'Punjab', '151001', '8901-2345-6789', 'STUV9021Y',
          'Punjab National Bank', '049281726351', 'PUNB0182700', 'balwantsingh@okpnb', '2025-02-01', 'Carpenter', 'Finishing', 'Highly-Skilled',
          900, 125, 'site-02', 'Active',
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80',
          'Specialist in finish carpentry, modular panels, and gypsum board ceiling framing.'
        ]
      ];

      for (const w of workers) {
        await client.query(`
          INSERT INTO workers (
            id, name, father_name, gender, dob, phone, emergency_contact,
            address, village, district, state, pin_code, aadhaar, pan,
            bank_name, account_number, ifsc_code, upi_id, joining_date, trade, department, skill_level,
            daily_wage, overtime_rate, current_site_id, status, photo, notes
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
            $23, $24, $25, $26, $27, $28
          );
        `, w);
      }
      console.log('Seeded initial labor registries.');
    }

    // 5. Seed Attendance
    const attCheck = await client.query('SELECT id FROM attendance LIMIT 1');
    if (attCheck.rows.length === 0) {
      const dates = ['2026-06-30', '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04'];
      const workersList = await client.query('SELECT id, current_site_id FROM workers');
      
      for (const date of dates) {
        for (const w of workersList.rows) {
          let status = 'Present';
          const rand = Math.random();
          if (rand < 0.05) status = 'Absent';
          else if (rand < 0.1) status = 'Half-Day';
          else if (rand < 0.15) status = 'Paid-Leave';
          else if (rand < 0.2 && w.current_site_id === 'site-01') status = 'Weekly-Off';

          const isNight = Math.random() < 0.15;
          const otHours = status === 'Present' && Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 : 0;
          
          await client.query(`
            INSERT INTO attendance (
              id, worker_id, date, status, is_night_shift, overtime_hours,
              time_in, time_out, gps_coordinates, supervisor_id, site_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
          `, [
            `att-${w.id}-${date}`,
            w.id,
            date,
            status,
            isNight,
            otHours,
            status === 'Present' || status === 'Half-Day' ? '09:00' : null,
            status === 'Present' ? (otHours > 0 ? `${18 + otHours}:00` : '18:00') : (status === 'Half-Day' ? '13:00' : null),
            w.current_site_id === 'site-01' ? '19.0264, 73.0725' : '19.0596, 72.8682',
            w.current_site_id === 'site-01' ? 'usr-super1' : 'usr-super2',
            w.current_site_id
          ]);
        }
      }
      console.log('Seeded attendance records for past 5 days.');
    }

    // 6. Seed Leaves
    const leavesCheck = await client.query('SELECT id FROM leaves LIMIT 1');
    if (leavesCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO leaves (id, worker_id, worker_name, leave_type, start_date, end_date, reason, status, comment, created_at)
        VALUES 
        ('lv-001', 'WRK-2026-001', 'Ramesh Yadav', 'Medical', '2026-07-10', '2026-07-12', 'Fever and medical checkup in native village', 'Pending', NULL, '2026-07-04T10:00:00Z'),
        ('lv-002', 'WRK-2026-004', 'Sunita Devi', 'Personal', '2026-07-02', '2026-07-02', 'Family function at home', 'Approved', 'Approved. Helper backup arranged.', '2026-07-01T15:20:00Z');
      `);
      console.log('Seeded default leave requests.');
    }

    // 7. Seed Notifications
    const notifCheck = await client.query('SELECT id FROM notifications LIMIT 1');
    if (notifCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO notifications (id, title, message, type, created_at, read)
        VALUES 
        ('not-01', 'Attendance Complete', 'Satish Kamble finalized attendance for Site 01 today.', 'success', '2026-07-04T12:00:00Z', false),
        ('not-02', 'New Leave Request', 'Ramesh Yadav submitted a medical leave request for 3 days.', 'info', '2026-07-04T10:05:00Z', false),
        ('not-03', 'Payment Pending', 'Wages calculation sheet for Sector 10 Metro is ready for approval.', 'warning', '2026-07-03T18:30:00Z', true);
      `);
      console.log('Seeded system notifications.');
    }

    // 8. Seed Chat
    const chatCheck = await client.query('SELECT id FROM chat LIMIT 1');
    if (chatCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO chat (id, site_id, sender_id, sender_name, sender_role, text, created_at)
        VALUES 
        ('msg-01', 'global', 'usr-owner', 'Rajesh Singhania', 'owner', 'Welcome to the MusterMate team channel. Supervisors, please make sure daily muster cards are updated before 7 PM.', '2026-07-03T09:00:00Z'),
        ('msg-02', 'global', 'usr-super1', 'Satish Kamble', 'supervisor', 'Acknowledged, sir. I have marked attendance for Metro station site.', '2026-07-03T09:15:00Z'),
        ('msg-03', 'site-01', 'usr-super1', 'Satish Kamble', 'supervisor', 'Reinforcement bars have arrived at gate 2. Unloading starts now.', '2026-07-04T11:00:00Z'),
        ('msg-04', 'site-01', 'usr-admin', 'Amit Sharma', 'admin', 'Please ensure workers wear proper harness safety belts during high elevation tracks.', '2026-07-04T11:30:00Z');
      `);
      console.log('Seeded chat logs.');
    }

  } catch (err) {
    console.error('Seeding database failed:', err);
  }
};

export { pool, initSchema };
export default pool;
