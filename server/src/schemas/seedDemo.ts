// Idempotent demo seed.
//
// When DEMO_SEED is enabled (default), this module refreshes the demo
// organization (org-101 by default) with transactional demo data whose dates
// are all computed relative to *today*. Rerunning it is safe: the demo
// organization's rows within the rolling window are cleaned before reinsert.
//
// It only ever touches the demo org's own data, never other organizations.

import { pool, hashPassword } from '../db';
import { config } from '../config';

// ---------------------------------------------------------------------------
// Deterministic helpers
// ---------------------------------------------------------------------------

const toDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateStr(d);
};

const isoFromNow = (days: number): string =>
  new Date(Date.now() + days * 86400000).toISOString();

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const GLOBAL_SITE = 'global';

// ---------------------------------------------------------------------------
// Seed data definitions (names/trades are presentational data, IDs are derived)
// ---------------------------------------------------------------------------

const siteDefs = [
  { id: 'site-01', name: 'Navi Mumbai HQ', address: '402, Metro Plaza, Sector 15, Vashi, Navi Mumbai, MH, 400703', gps: '19.0596, 72.8682', status: 'active' },
  { id: 'site-02', name: 'Pune Metro Works', address: 'Plot 18, Hadapsar Industrial Estate, Pune, MH, 411013', gps: '18.5089, 73.9260', status: 'active' },
  { id: 'site-03', name: 'Nashik Road Works', address: 'Survey 122, Nashik Road, Nashik, MH, 422101', gps: '19.9987, 73.7898', status: 'on-hold' },
];

const workerDefs = [
  { id: 'WRK-2026-001', name: 'Ramesh Yadav', father: 'Suresh Yadav', trade: 'Mason', skill: 'Skilled', wage: 750, ot: 80, site: 'site-01', phone: '+91 9876500001' },
  { id: 'WRK-2026-002', name: 'Subhash Gond', father: 'Gopal Gond', trade: 'Helper', skill: 'Helper', wage: 450, ot: 50, site: 'site-01', phone: '+91 9876500002' },
  { id: 'WRK-2026-003', name: 'Manpreet Singh', father: 'Jaswinder Singh', trade: 'Carpenter', skill: 'Skilled', wage: 900, ot: 100, site: 'site-02', phone: '+91 9876500003' },
  { id: 'WRK-2026-004', name: 'Sunita Devi', father: 'Ramesh Mahto', trade: 'Helper', skill: 'Helper', wage: 450, ot: 50, site: 'site-01', phone: '+91 9876500004' },
  { id: 'WRK-2026-005', name: 'Kiran Kumar', father: 'Prakash Kumar', trade: 'Bar Bender', skill: 'Semi-Skilled', wage: 800, ot: 90, site: 'site-02', phone: '+91 9876500005' },
  { id: 'WRK-2026-006', name: 'Aniket Sawant', father: 'Dattatray Sawant', trade: 'Mason', skill: 'Highly-Skilled', wage: 850, ot: 90, site: 'site-02', phone: '+91 9876500006' },
  { id: 'WRK-2026-007', name: 'Balwant Singh', father: 'Harbhajan Singh', trade: 'Carpenter', skill: 'Skilled', wage: 900, ot: 100, site: 'site-01', phone: '+91 9876500007' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const resolveUserByEmail = async (email: string) => {
  const { rows } = await pool.query('SELECT uid FROM users WHERE email = $1 LIMIT 1', [email]);
  return rows[0]?.uid || null;
};

interface SeedUsers {
  owner: string;
  admin: string;
  supervisors: string[];
  labour: string;
}

const ensureUsers = async (): Promise<SeedUsers> => {
  const d = config.demo;
  const ids: SeedUsers = { owner: '', admin: '', supervisors: [], labour: '' };

  const upsert = async (
    role: string,
    profile: { name: string; email: string; phone: string; password: string },
    opts: { siteId?: string; workerId?: string; fallbackUid: string }
  ) => {
    const existingUid = await resolveUserByEmail(profile.email);
    const uid = existingUid || opts.fallbackUid;
    const hash = hashPassword(profile.password);
    await pool.query(
      `
      INSERT INTO users (uid, name, email, phone, role, site_id, organization_id, password, worker_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (uid) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        site_id = EXCLUDED.site_id,
        organization_id = EXCLUDED.organization_id,
        password = EXCLUDED.password,
        worker_id = EXCLUDED.worker_id
      `,
      [uid, profile.name, profile.email, profile.phone, role, opts.siteId || null, d.orgId, hash, opts.workerId || null]
    );
    return uid;
  };

  ids.owner = await upsert('owner', d.owner, { fallbackUid: 'usr-demo-owner' });
  ids.admin = await upsert('admin', d.admin, { fallbackUid: 'usr-demo-admin' });
  ids.supervisors.push(
    await upsert('supervisor', d.supervisors[0], { siteId: 'site-01', fallbackUid: 'usr-demo-super-1' })
  );
  ids.supervisors.push(
    await upsert('supervisor', d.supervisors[1], { siteId: 'site-02', fallbackUid: 'usr-demo-super-2' })
  );
  ids.labour = await upsert('labour', d.labour, {
    siteId: 'site-01',
    workerId: 'WRK-2026-001',
    fallbackUid: 'usr-demo-labour',
  });

  return ids;
};

const ensureSites = async (users: SeedUsers) => {
  const siteRows = siteDefs.map((s, idx) => ({
    id: s.id,
    name: s.name,
    address: s.address,
    gps: s.gps,
    status: s.status,
    supervisorId: users.supervisors[idx % users.supervisors.length],
    orgId: config.demo.orgId,
  }));
  for (const s of siteRows) {
    await pool.query(
      `
      INSERT INTO sites (id, name, address, gps_coordinates, status, supervisor_id, workers_count, organization_id)
      VALUES ($1, $2, $3, $4, $5, $6, 0, $7)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        gps_coordinates = EXCLUDED.gps_coordinates,
        status = EXCLUDED.status,
        supervisor_id = EXCLUDED.supervisor_id,
        organization_id = EXCLUDED.organization_id
      `,
      [s.id, s.name, s.address, s.gps, s.status, s.supervisorId, s.orgId]
    );
  }
};

const ensureWorkers = async (users: SeedUsers) => {
  const d = config.demo;
  for (const w of workerDefs.slice(0, d.workerCount)) {
    await pool.query(
      `
      INSERT INTO workers (
        id, name, father_name, phone, trade, department, skill_level,
        daily_wage, overtime_rate, current_site_id, status, joining_date, organization_id
      )
      VALUES ($1, $2, $3, $4, $5, 'Civil', $6, $7, $8, $9, 'Active', CURRENT_DATE::text, $10)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        father_name = EXCLUDED.father_name,
        phone = EXCLUDED.phone,
        trade = EXCLUDED.trade,
        skill_level = EXCLUDED.skill_level,
        daily_wage = EXCLUDED.daily_wage,
        overtime_rate = EXCLUDED.overtime_rate,
        current_site_id = EXCLUDED.current_site_id,
        status = EXCLUDED.status,
        organization_id = EXCLUDED.organization_id
      `,
      [w.id, w.name, w.father, w.phone, w.trade, w.skill, w.wage, w.ot, w.site, d.orgId]
    );
  }
  // Link the labour account's worker if it changed.
  await pool.query(
    `UPDATE users SET worker_id = $1 WHERE uid = $2 AND worker_id IS NULL`,
    ['WRK-2026-001', users.labour]
  );
};

// ---------------------------------------------------------------------------
// Transactional demo data (all dates relative to today)
// ---------------------------------------------------------------------------

const cleanDemoRows = async (workerIds: string[]) => {
  const d = config.demo;
  const workerArray = `{${workerIds.join(',')}}`;
  await pool.query(`DELETE FROM attendance WHERE organization_id = $1 OR worker_id = ANY($2::text[])`, [d.orgId, workerArray]);
  await pool.query(`DELETE FROM labour_submissions WHERE organization_id = $1 OR worker_id = ANY($2::text[])`, [d.orgId, workerArray]);
  await pool.query(`DELETE FROM payments WHERE organization_id = $1 OR worker_id = ANY($2::text[])`, [d.orgId, workerArray]);
  await pool.query(`DELETE FROM leaves WHERE organization_id = $1 OR worker_id = ANY($2::text[])`, [d.orgId, workerArray]);
  await pool.query(`DELETE FROM notifications WHERE organization_id = $1`, [d.orgId]);
  await pool.query(`DELETE FROM chat WHERE organization_id = $1`, [d.orgId]);
};

const seedAttendance = async (users: SeedUsers) => {
  const d = config.demo;
  const windowDays = d.attendanceWindowDays;
  const workers = workerDefs.slice(0, d.workerCount);

  for (const worker of workers) {
    const rng = mulberry32(hashCode(worker.id));
    const site = siteDefs.find(s => s.id === worker.site)!;
    const supervisorId = site.id === 'site-01' ? users.supervisors[0] : users.supervisors[1];
    const rows: unknown[][] = [];

    for (let offset = windowDays - 1; offset >= 0; offset--) {
      const date = daysAgo(offset);
      const dayOfWeek = new Date(Date.now() - offset * 86400000).getDay();

      let status = 'Present';
      if (dayOfWeek === 0) status = 'Weekly-Off';
      else {
        const roll = rng();
        if (roll > 0.82) status = 'Absent';
        else if (roll > 0.72) status = 'Half-Day';
        else if (roll > 0.66) status = 'Paid-Leave';
      }

      const isNightShift = rng() > 0.88 && status === 'Present';
      const overtimeHours = status === 'Present' && rng() > 0.6 ? Math.floor(rng() * 3) + 1 : 0;
      const timeIn = isNightShift ? '20:00' : '08:30';
      const timeOut = isNightShift ? '05:00' : '17:30';

      rows.push([
        `att-${worker.id}-${date}`,
        worker.id,
        date,
        status,
        isNightShift,
        overtimeHours,
        timeIn,
        timeOut,
        site.gps,
        supervisorId,
        site.id,
        d.orgId,
      ]);
    }

    if (rows.length === 0) continue;
    const placeholders = rows.map((_, i) =>
      `($${i * 12 + 1}, $${i * 12 + 2}, $${i * 12 + 3}, $${i * 12 + 4}, $${i * 12 + 5}, $${i * 12 + 6}, $${i * 12 + 7}, $${i * 12 + 8}, $${i * 12 + 9}, $${i * 12 + 10}, $${i * 12 + 11}, $${i * 12 + 12})`
    ).join(', ');
    await pool.query(
      `
      INSERT INTO attendance (
        id, worker_id, date, status, is_night_shift, overtime_hours,
        time_in, time_out, gps_coordinates, supervisor_id, site_id, organization_id
      )
      VALUES ${placeholders}
      ON CONFLICT (id) DO NOTHING
      `,
      rows.flat()
    );
  }
};

const seedLabourSubmissions = async (users: SeedUsers) => {
  const d = config.demo;
  const worker = workerDefs[0];
  const rng = mulberry32(hashCode(worker.id + '-claims'));
  const { rows: attendance } = await pool.query(
    `SELECT id, date, status, overtime_hours, is_night_shift FROM attendance WHERE worker_id = $1`,
    [worker.id]
  );

  const subs: unknown[][] = [];
  for (const att of attendance) {
    if (rng() < 0.55) continue;
    const matches = rng() > 0.22;
    const status = matches ? att.status : (att.status === 'Present' ? 'Absent' : 'Present');
    const overtimeHours = matches ? att.overtime_hours : (att.status === 'Present' ? 1 : 0);
    const isNightShift = matches ? att.is_night_shift : false;
    subs.push([
      `claim-${worker.id}-${att.date}`,
      worker.id,
      att.date,
      status,
      isNightShift,
      overtimeHours,
      '08:40',
      '17:20',
      att.status === 'Present' ? 'Present for full shift, poured columns on floor 2.' : 'Reported to site office.',
      new Date(att.date + 'T08:00:00').toISOString(),
      d.orgId,
    ]);
  }

  if (subs.length === 0) return;
  const placeholders = subs.map((_, i) =>
    `($${i * 11 + 1}, $${i * 11 + 2}, $${i * 11 + 3}, $${i * 11 + 4}, $${i * 11 + 5}, $${i * 11 + 6}, $${i * 11 + 7}, $${i * 11 + 8}, $${i * 11 + 9}, $${i * 11 + 10}, $${i * 11 + 11})`
  ).join(', ');
  await pool.query(
    `
    INSERT INTO labour_submissions (
      id, worker_id, date, status, is_night_shift, overtime_hours,
      time_in, time_out, remarks, created_at, organization_id
    )
    VALUES ${placeholders}
    ON CONFLICT (id) DO NOTHING
    `,
    subs.flat()
  );
};

const seedPayments = async () => {
  const d = config.demo;
  const windowDays = d.attendanceWindowDays;
  const workers = workerDefs.slice(0, d.workerCount);
  const rows: unknown[][] = [];
  const paymentTypes = ['Cash', 'UPI', 'Bank Transfer'];

  for (const worker of workers) {
    const rng = mulberry32(hashCode(worker.id + '-pay'));
    const paymentsPerWorker = Math.min(2, Math.max(1, Math.floor(windowDays / 7)));
    for (let i = 0; i < paymentsPerWorker; i++) {
      const offset = Math.floor(windowDays / paymentsPerWorker) * (i + 1) - 1;
      const date = daysAgo(Math.max(0, offset));
      const amount = worker.wage * 6 + (rng() > 0.6 ? 300 : 0);
      rows.push([
        `pay-${worker.id}-${i}`,
        worker.id,
        worker.name,
        date,
        amount,
        paymentTypes[Math.floor(rng() * paymentTypes.length)],
        `TXN${Math.floor(rng() * 900000) + 100000}`,
        'Wage',
        d.orgId,
      ]);
    }
  }

  if (rows.length === 0) return;
  const placeholders = rows.map((_, i) =>
    `($${i * 9 + 1}, $${i * 9 + 2}, $${i * 9 + 3}, $${i * 9 + 4}, $${i * 9 + 5}, $${i * 9 + 6}, $${i * 9 + 7}, $${i * 9 + 8}, $${i * 9 + 9})`
  ).join(', ');
  await pool.query(
    `
    INSERT INTO payments (
      id, worker_id, worker_name, date, amount, payment_type, reference_number, type, organization_id
    )
    VALUES ${placeholders}
    ON CONFLICT (id) DO NOTHING
    `,
    rows.flat()
  );
};

const seedLeaves = async () => {
  const d = config.demo;
  const workers = workerDefs.slice(0, d.workerCount);
  const rows: unknown[][] = [
    [
      'lv-demo-1', workers[1].id, workers[1].name, 'Medical',
      daysAgo(2), daysAgo(1), 'Follow-up appointment at the district hospital.',
      'Approved', isoFromNow(-4),
    ],
    [
      'lv-demo-2', workers[3].id, workers[3].name, 'Personal',
      daysAgo(1), daysAgo(1), 'Personal family function.',
      'Approved', isoFromNow(-3),
    ],
    [
      'lv-demo-3', workers[0].id, workers[0].name, 'Paid',
      daysAgo(4), daysAgo(3), 'Village visit.',
      'Rejected', isoFromNow(-5),
    ],
    [
      'lv-demo-4', workers[2].id, workers[2].name, 'Medical',
      daysAgo(-3), daysAgo(-1), 'Dental surgery and recovery.',
      'Pending', isoFromNow(0),
    ],
    [
      'lv-demo-5', workers[4].id, workers[4].name, 'Personal',
      daysAgo(-10), daysAgo(-9), 'Family wedding in hometown.',
      'Pending', isoFromNow(0),
    ],
  ];

  const placeholders = rows.map((_, i) =>
    `($${i * 10 + 1}, $${i * 10 + 2}, $${i * 10 + 3}, $${i * 10 + 4}, $${i * 10 + 5}, $${i * 10 + 6}, $${i * 10 + 7}, $${i * 10 + 8}, $${i * 10 + 9}, $${i * 10 + 10})`
  ).join(', ');
  await pool.query(
    `
    INSERT INTO leaves (
      id, worker_id, worker_name, leave_type, start_date, end_date,
      reason, status, created_at, organization_id
    )
    VALUES ${placeholders}
    ON CONFLICT (id) DO NOTHING
    `,
    rows.map(r => [...r, d.orgId]).flat()
  );
};

const seedNotifications = async () => {
  const d = config.demo;
  const rows: unknown[][] = [
    ['notif-demo-1', 'Attendance finalized', 'Morning muster sheet finalized for today across active sites.', 'success', isoFromNow(0)],
    ['notif-demo-2', 'New leave request', 'Manpreet Singh requested medical leave for the coming days.', 'warning', isoFromNow(0)],
    ['notif-demo-3', 'Weekly wages released', 'Weekly wage payments were released to the masonry crew.', 'info', isoFromNow(0)],
  ];
  const placeholders = rows.map((_, i) =>
    `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`
  ).join(', ');
  await pool.query(
    `
    INSERT INTO notifications (id, title, message, type, created_at, organization_id)
    VALUES ${placeholders}
    ON CONFLICT (id) DO NOTHING
    `,
    rows.map(r => [...r, d.orgId]).flat()
  );
};

const seedChat = async (users: SeedUsers) => {
  const d = config.demo;
  const owner = users.owner;
  const super1 = users.supervisors[0];
  const labour = users.labour;
  const rows: unknown[][] = [
    [GLOBAL_SITE, owner, config.demo.owner.name, 'owner', 'Good morning team. Today is a full pour day at all sites — please confirm crew counts by 8 AM.', isoFromNow(0)],
    [GLOBAL_SITE, super1, config.demo.supervisors[0].name, 'supervisor', 'Morning. Navi Mumbai HQ has 4 masons and 3 helpers on roster today. Scaffold inspection done.', isoFromNow(0)],
    ['site-01', super1, config.demo.supervisors[0].name, 'supervisor', 'Sector 15 slab reinforcement completed. Ready for concrete after 2 PM.', isoFromNow(0)],
    ['site-01', labour, config.demo.labour.name, 'labour', 'Received. Will recheck the reinforcement spacing before pouring.', isoFromNow(0)],
  ];
  const placeholders = rows.map((_, i) =>
    `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`
  ).join(', ');
  await pool.query(
    `
    INSERT INTO chat (id, site_id, sender_id, sender_name, sender_role, text, created_at, organization_id)
    VALUES ${placeholders}
    ON CONFLICT (id) DO NOTHING
    `,
    rows.map((r, i) => [`msg-demo-${i + 1}`, ...r, d.orgId]).flat()
  );
};

const hashCode = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export const seedDemo = async (): Promise<void> => {
  const d = config.demo;
  console.log(`Seeding demo organization '${d.orgId}'...`);

  await pool.query(
    `
    INSERT INTO organizations (id, name, gst_number, address, phone, email, owner_id)
    VALUES ($1, $2, $3, $4, $5, $6, '')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      gst_number = EXCLUDED.gst_number,
      address = EXCLUDED.address,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email
    `,
    [d.orgId, d.orgName, d.orgGst, d.orgAddress, d.orgPhone, d.orgEmail]
  );

  const users = await ensureUsers();
  await ensureSites(users);
  await ensureWorkers(users);

  const workerIds = workerDefs.slice(0, d.workerCount).map(w => w.id);
  await cleanDemoRows(workerIds);

  await seedAttendance(users);
  await seedLabourSubmissions(users);
  await seedPayments();
  await seedLeaves();
  await seedNotifications();
  await seedChat(users);

  console.log(`Demo organization '${d.orgId}' seeded successfully.`);
};
