import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool, hashPassword } from './db';
import { initSchema } from './schemas/dbInit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '20mb' })); // Allow signature Base64 data urls

// Initialize tables on start
initSchema();

// --- API Endpoints ---

// 1. Organization
app.get('/api/organization', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM organizations LIMIT 1');
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
});

app.post('/api/organization', async (req, res) => {
  const { id, name, logo, gst_number, address, phone, email, owner_id } = req.body;
  try {
    await pool.query(`
      INSERT INTO organizations (id, name, logo, gst_number, address, phone, email, owner_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        logo = EXCLUDED.logo,
        gst_number = EXCLUDED.gst_number,
        address = EXCLUDED.address,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email;
    `, [id, name, logo, gst_number, address, phone, email, owner_id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database update failed' });
  }
});

// 2. Users / Auth
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY name ASC');
    res.json(result.rows.map(u => ({
      uid: u.uid,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      siteId: u.site_id,
      organizationId: u.organization_id,
      workerId: u.worker_id
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
});

app.post('/api/users', async (req, res) => {
  const { uid, name, email, phone, role, siteId, organizationId, password, workerId } = req.body;
  try {
    const hashed = password ? hashPassword(password) : null;
    
    // Check if user exists to handle partial password updates
    const userExist = await pool.query('SELECT password FROM users WHERE uid = $1', [uid]);
    
    if (userExist.rows.length > 0) {
      await pool.query(`
        UPDATE users SET
          name = $2,
          email = $3,
          phone = $4,
          role = $5,
          site_id = $6,
          organization_id = $7,
          worker_id = $8,
          password = COALESCE($9, password)
        WHERE uid = $1;
      `, [uid, name, email, phone, role, siteId, organizationId || 'org-101', workerId || null, hashed]);
    } else {
      await pool.query(`
        INSERT INTO users (uid, name, email, phone, role, site_id, organization_id, password, worker_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `, [uid, name, email, phone, role, siteId, organizationId || 'org-101', hashed, workerId || null]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database saving failed' });
  }
});

app.delete('/api/users/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE uid = $1', [uid]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database deletion failed' });
  }
});

// Authentication handlers
app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password, organizationName } = req.body;
  try {
    await pool.query('BEGIN');
    
    const ownerUid = `usr-owner-${Date.now()}`;
    const orgId = `org-${Date.now()}`;
    const defaultSiteId = `site-${Date.now()}`;
    const hashed = hashPassword(password);
    
    // 1. Create Organization
    await pool.query(`
      INSERT INTO organizations (id, name, owner_id)
      VALUES ($1, $2, $3);
    `, [orgId, organizationName, ownerUid]);

    // 2. Create Default Main Site
    await pool.query(`
      INSERT INTO sites (id, name, address, status, supervisor_id, workers_count)
      VALUES ($1, $2, $3, $4, $5, $6);
    `, [defaultSiteId, 'Headquarters / Main Site', 'Default company location', 'active', ownerUid, 0]);
    
    // 3. Create Owner User
    await pool.query(`
      INSERT INTO users (uid, name, email, phone, role, organization_id, site_id, password)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `, [ownerUid, name, email, phone, 'owner', orgId, defaultSiteId, hashed]);
    
    await pool.query('COMMIT');
    
    res.json({
      success: true,
      user: {
        uid: ownerUid,
        name,
        email,
        phone,
        role: 'owner',
        organizationId: orgId,
        siteId: defaultSiteId
      }
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { loginId, password } = req.body;
  try {
    const hashed = hashPassword(password);
    const result = await pool.query(`
      SELECT * FROM users 
      WHERE email = $1 OR phone = $1 OR uid = $1 OR worker_id = $1;
    `, [loginId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User profile not found' });
    }
    
    const user = result.rows[0];
    if (user.password && user.password !== hashed) {
      return res.status(401).json({ error: 'Incorrect credentials password' });
    }
    
    res.json({
      success: true,
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        siteId: user.site_id,
        organizationId: user.organization_id,
        workerId: user.worker_id
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login validation failed' });
  }
});

// 3. Workers
app.get('/api/workers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM workers ORDER BY id ASC');
    // Convert numerical wage values to standard numbers
    const formatted = result.rows.map(w => ({
      ...w,
      dailyWage: parseFloat(w.daily_wage),
      overtimeRate: parseFloat(w.overtime_rate),
      fatherName: w.father_name,
      emergencyContact: w.emergency_contact,
      pinCode: w.pin_code,
      bankName: w.bank_name,
      accountNumber: w.account_number,
      ifscCode: w.ifsc_code,
      upiId: w.upi_id,
      joiningDate: w.joining_date,
      skillLevel: w.skill_level,
      currentSiteId: w.current_site_id
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
});

app.post('/api/workers', async (req, res) => {
  const {
    id, name, fatherName, gender, dob, phone, emergencyContact,
    address, village, district, state, pinCode, aadhaar, pan,
    bankName, accountNumber, ifscCode, upiId, trade, department, skillLevel,
    dailyWage, overtimeRate, currentSiteId, status, photo, notes
  } = req.body;

  try {
    await pool.query(`
      INSERT INTO workers (
        id, name, father_name, gender, dob, phone, emergency_contact,
        address, village, district, state, pin_code, aadhaar, pan,
        bank_name, account_number, ifsc_code, upi_id, joining_date, trade, department, skill_level,
        daily_wage, overtime_rate, current_site_id, status, photo, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
              CURRENT_DATE::text, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        father_name = EXCLUDED.father_name,
        gender = EXCLUDED.gender,
        dob = EXCLUDED.dob,
        phone = EXCLUDED.phone,
        emergency_contact = EXCLUDED.emergency_contact,
        address = EXCLUDED.address,
        village = EXCLUDED.village,
        district = EXCLUDED.district,
        state = EXCLUDED.state,
        pin_code = EXCLUDED.pin_code,
        aadhaar = EXCLUDED.aadhaar,
        pan = EXCLUDED.pan,
        bank_name = EXCLUDED.bank_name,
        account_number = EXCLUDED.account_number,
        ifsc_code = EXCLUDED.ifsc_code,
        upi_id = EXCLUDED.upi_id,
        trade = EXCLUDED.trade,
        department = EXCLUDED.department,
        skill_level = EXCLUDED.skill_level,
        daily_wage = EXCLUDED.daily_wage,
        overtime_rate = EXCLUDED.overtime_rate,
        current_site_id = EXCLUDED.current_site_id,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes;
    `, [
      id, name, fatherName, gender, dob, phone, emergencyContact,
      address, village, district, state, pinCode, aadhaar, pan,
      bankName, accountNumber, ifscCode, upiId, trade, department, skillLevel,
      dailyWage, overtimeRate, currentSiteId, status, photo, notes
    ]);
    
    // Auto Update Workers count for site
    await updateSiteWorkersCount(currentSiteId);
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database saving failed' });
  }
});

app.delete('/api/workers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const workerQuery = await pool.query('SELECT current_site_id FROM workers WHERE id=$1', [id]);
    const siteId = workerQuery.rows[0]?.current_site_id;
    
    await pool.query('DELETE FROM workers WHERE id = $1', [id]);
    if (siteId) {
      await updateSiteWorkersCount(siteId);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database deletion failed' });
  }
});

// 4. Sites
app.get('/api/sites', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sites ORDER BY id ASC');
    const formatted = result.rows.map(s => ({
      ...s,
      gpsCoordinates: s.gps_coordinates,
      supervisorId: s.supervisor_id,
      workersCount: s.workers_count
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
});

app.post('/api/sites', async (req, res) => {
  const { id, name, address, gpsCoordinates, status, supervisorId, workersCount } = req.body;
  try {
    await pool.query(`
      INSERT INTO sites (id, name, address, gps_coordinates, status, supervisor_id, workers_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        gps_coordinates = EXCLUDED.gps_coordinates,
        status = EXCLUDED.status,
        supervisor_id = EXCLUDED.supervisor_id;
    `, [id, name, address, gpsCoordinates, status, supervisorId, workersCount || 0]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database saving failed' });
  }
});

app.delete('/api/sites/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('BEGIN');
    // Clear site assignments in workers
    await pool.query('UPDATE workers SET current_site_id = NULL WHERE current_site_id = $1', [id]);
    // Clear site assignments in users
    await pool.query('UPDATE users SET site_id = NULL WHERE site_id = $1', [id]);
    // Delete site
    await pool.query('DELETE FROM sites WHERE id = $1', [id]);
    await pool.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Database deletion failed' });
  }
});

// Helper: update active workers count in sites table
const updateSiteWorkersCount = async (siteId) => {
  if (!siteId) return;
  try {
    await pool.query(`
      UPDATE sites 
      SET workers_count = (SELECT COUNT(id) FROM workers WHERE current_site_id = $1 AND status = 'Active')
      WHERE id = $1
    `, [siteId]);
  } catch (err) {
    console.error('Failed to update site counts', err);
  }
};

// 5. Attendance
app.get('/api/attendance', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM attendance');
    const formatted = result.rows.map(a => ({
      ...a,
      workerId: a.worker_id,
      isNightShift: a.is_night_shift,
      overtimeHours: a.overtime_hours,
      timeIn: a.time_in,
      timeOut: a.time_out,
      gpsCoordinates: a.gps_coordinates,
      photoProof: a.photo_proof,
      supervisorId: a.supervisor_id,
      siteId: a.site_id
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
});

app.post('/api/attendance', async (req, res) => {
  const records = req.body; // Array of AttendanceRecord
  try {
    await pool.query('BEGIN');
    for (const rec of records) {
      await pool.query(`
        INSERT INTO attendance (
          id, worker_id, date, status, is_night_shift, overtime_hours,
          time_in, time_out, gps_coordinates, photo_proof, supervisor_id, site_id, remarks
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          is_night_shift = EXCLUDED.is_night_shift,
          overtime_hours = EXCLUDED.overtime_hours,
          time_in = EXCLUDED.time_in,
          time_out = EXCLUDED.time_out,
          gps_coordinates = EXCLUDED.gps_coordinates,
          photo_proof = EXCLUDED.photo_proof,
          remarks = EXCLUDED.remarks;
      `, [
        rec.id, rec.workerId, rec.date, rec.status, rec.isNightShift || false, rec.overtimeHours || 0,
        rec.timeIn, rec.timeOut, rec.gpsCoordinates, rec.photoProof, rec.supervisorId, rec.siteId, rec.remarks
      ]);
    }
    await pool.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Database batch update failed' });
  }
});

// 6. Payments
app.get('/api/payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments ORDER BY date DESC, id DESC');
    const formatted = result.rows.map(p => ({
      ...p,
      workerId: p.worker_id,
      workerName: p.worker_name,
      amount: parseFloat(p.amount),
      paymentType: p.payment_type,
      referenceNumber: p.reference_number,
      workerSignature: p.worker_signature
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
});

app.post('/api/payments', async (req, res) => {
  const { id, workerId, workerName, date, amount, paymentType, referenceNumber, type, workerSignature, notes } = req.body;
  try {
    await pool.query(`
      INSERT INTO payments (id, worker_id, worker_name, date, amount, payment_type, reference_number, type, worker_signature, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [id, workerId, workerName, date, amount, paymentType, referenceNumber, type, workerSignature, notes]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database saving failed' });
  }
});

app.delete('/api/payments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM payments WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database deletion failed' });
  }
});

// 7. Leaves
app.get('/api/leaves', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leaves ORDER BY created_at DESC');
    const formatted = result.rows.map(l => ({
      ...l,
      workerId: l.worker_id,
      workerName: l.worker_name,
      leaveType: l.leave_type,
      startDate: l.start_date,
      endDate: l.end_date,
      createdAt: l.created_at
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
});

app.post('/api/leaves', async (req, res) => {
  const { id, workerId, workerName, leaveType, startDate, endDate, reason, status, comment, createdAt } = req.body;
  try {
    await pool.query(`
      INSERT INTO leaves (id, worker_id, worker_name, leave_type, start_date, end_date, reason, status, comment, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        comment = EXCLUDED.comment;
    `, [id, workerId, workerName, leaveType, startDate, endDate, reason, status, comment, createdAt]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database saving failed' });
  }
});

// 8. Notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
    const formatted = result.rows.map(n => ({
      ...n,
      createdAt: n.created_at
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
});

app.post('/api/notifications/read', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET read = TRUE');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database update failed' });
  }
});

// 9. Chat
app.get('/api/chat/:siteId', async (req, res) => {
  const { siteId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM chat WHERE site_id = $1 ORDER BY created_at ASC', [siteId]);
    const formatted = result.rows.map(c => ({
      ...c,
      siteId: c.site_id,
      senderId: c.sender_id,
      senderName: c.sender_name,
      senderRole: c.sender_role,
      imageUrl: c.image_url,
      createdAt: c.created_at
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { id, siteId, senderId, senderName, senderRole, text, imageUrl, createdAt } = req.body;
  try {
    await pool.query(`
      INSERT INTO chat (id, site_id, sender_id, sender_name, sender_role, text, image_url, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [id, siteId, senderId, senderName, senderRole, text, imageUrl, createdAt]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database saving failed' });
  }
});

// 10. Labour Submissions
app.get('/api/labour/submissions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM labour_submissions ORDER BY date DESC');
    res.json(result.rows.map(row => ({
      id: row.id,
      workerId: row.worker_id,
      date: row.date,
      status: row.status,
      isNightShift: row.is_night_shift,
      overtimeHours: row.overtime_hours,
      timeIn: row.time_in,
      timeOut: row.time_out,
      remarks: row.remarks,
      createdAt: row.created_at
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
});

app.post('/api/labour/submissions', async (req, res) => {
  const { id, workerId, date, status, isNightShift, overtimeHours, timeIn, timeOut, remarks, createdAt } = req.body;
  try {
    await pool.query(`
      INSERT INTO labour_submissions (id, worker_id, date, status, is_night_shift, overtime_hours, time_in, time_out, remarks, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (worker_id, date) DO UPDATE SET
        status = EXCLUDED.status,
        is_night_shift = EXCLUDED.is_night_shift,
        overtime_hours = EXCLUDED.overtime_hours,
        time_in = EXCLUDED.time_in,
        time_out = EXCLUDED.time_out,
        remarks = EXCLUDED.remarks,
        created_at = EXCLUDED.created_at;
    `, [id, workerId, date, status, isNightShift || false, overtimeHours || 0, timeIn, timeOut, remarks, createdAt]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database saving failed' });
  }
});

app.listen(PORT, () => {
  console.log(`MusterMate Express server running on port ${PORT}`);
});
