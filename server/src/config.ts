// Central runtime configuration.
// All environment-driven values that were previously hardcoded across the
// codebase (demo org identity, seed flags, backfill fallback, rate limits)
// live here so nothing in the app relies on magic strings.

const bool = (value: string | undefined, fallback: boolean): boolean =>
  value === undefined ? fallback : value.toLowerCase() === 'true';

export const config = {
  // Organization assigned to legacy rows whose owner could not be inferred.
  backfillFallbackOrg: process.env.FALLBACK_ORG_ID || 'org-101',

  // Demo seeding is enabled by default so a fresh database boots into a usable
  // demo org. Disable with DEMO_SEED=false in production.
  demo: {
    enabled: bool(process.env.DEMO_SEED, true),
    orgId: process.env.DEMO_ORG_ID || 'org-101',
    orgName: process.env.DEMO_ORG_NAME || 'MusterMate Buildcon Private Limited',
    orgGst: process.env.DEMO_ORG_GST || '27AADCM3241F1ZH',
    orgAddress: process.env.DEMO_ORG_ADDRESS || '402, Metro Plaza, Sector 15, Vashi, Navi Mumbai, MH, 400703',
    orgPhone: process.env.DEMO_ORG_PHONE || '+91 22 2781 9090',
    orgEmail: process.env.DEMO_ORG_EMAIL || 'ops@mustermate.com',
    owner: {
      name: process.env.DEMO_OWNER_NAME || 'Rajesh Singhania',
      email: process.env.DEMO_OWNER_EMAIL || 'owner@mustermate.com',
      phone: process.env.DEMO_OWNER_PHONE || '+91 9876543210',
      password: process.env.DEMO_OWNER_PASSWORD || 'owner123',
    },
    admin: {
      name: process.env.DEMO_ADMIN_NAME || 'Amit Sharma',
      email: process.env.DEMO_ADMIN_EMAIL || 'admin@mustermate.com',
      phone: process.env.DEMO_ADMIN_PHONE || '+91 9876543211',
      password: process.env.DEMO_ADMIN_PASSWORD || 'admin123',
    },
    supervisors: [
      {
        name: process.env.DEMO_SUPERVISOR_1_NAME || 'Satish Kamble',
        email: process.env.DEMO_SUPERVISOR_1_EMAIL || 'satish@mustermate.com',
        phone: process.env.DEMO_SUPERVISOR_1_PHONE || '+91 9876543212',
        password: process.env.DEMO_SUPERVISOR_1_PASSWORD || 'super123',
      },
      {
        name: process.env.DEMO_SUPERVISOR_2_NAME || 'Dinesh Patel',
        email: process.env.DEMO_SUPERVISOR_2_EMAIL || 'dinesh@mustermate.com',
        phone: process.env.DEMO_SUPERVISOR_2_PHONE || '+91 9876543213',
        password: process.env.DEMO_SUPERVISOR_2_PASSWORD || 'dinesh123',
      },
    ],
    labour: {
      name: process.env.DEMO_LABOUR_NAME || 'Ramesh Yadav',
      email: process.env.DEMO_LABOUR_EMAIL || 'ramesh@mustermate.com',
      phone: process.env.DEMO_LABOUR_PHONE || '+91 9876543214',
      password: process.env.DEMO_LABOUR_PASSWORD || 'labour123',
    },
    // Rolling window of attendance history generated relative to today.
    attendanceWindowDays: Number(process.env.DEMO_ATTENDANCE_WINDOW_DAYS || 14),
    workerCount: Number(process.env.DEMO_WORKER_COUNT || 7),
  },

  rateLimit: {
    loginWindowMs: Number(process.env.LOGIN_WINDOW_MS || 15 * 60 * 1000),
    loginMax: Number(process.env.LOGIN_MAX_REQUESTS || 20),
    registerWindowMs: Number(process.env.REGISTER_WINDOW_MS || 15 * 60 * 1000),
    registerMax: Number(process.env.REGISTER_MAX_REQUESTS || 10),
  },
};

export interface DemoAccountInfo {
  label: string;
  email: string;
  password: string;
}

export const demoAccounts = (): DemoAccountInfo[] => [
  { label: 'Owner', email: config.demo.owner.email, password: config.demo.owner.password },
  { label: 'Supervisor', email: config.demo.supervisors[0].email, password: config.demo.supervisors[0].password },
  { label: 'Labour', email: config.demo.labour.email, password: config.demo.labour.password },
];
