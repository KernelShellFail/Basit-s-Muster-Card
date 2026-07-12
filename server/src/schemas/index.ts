import { z } from 'zod';

export const OrganizationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  logo: z.string().optional(),
  gst_number: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  owner_id: z.string().optional(),
});

export const UserSchema = z.object({
  uid: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(['owner', 'admin', 'supervisor', 'labour', 'viewer']),
  site_id: z.string().optional(),
  organization_id: z.string().optional(),
  password: z.string().optional(),
  worker_id: z.string().optional(),
});

export const SiteSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  gps_coordinates: z.string().optional(),
  status: z.enum(['active', 'completed', 'on-hold']).default('active'),
  supervisor_id: z.string().optional(),
  workers_count: z.number().default(0).optional(),
});

export const WorkerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  father_name: z.string().optional(),
  gender: z.string().optional(),
  dob: z.string().optional(),
  phone: z.string().optional(),
  emergency_contact: z.string().optional(),
  address: z.string().optional(),
  village: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pin_code: z.string().optional(),
  aadhaar: z.string().optional(),
  pan: z.string().optional(),
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  ifsc_code: z.string().optional(),
  uan: z.string().optional(),
  esic: z.string().optional(),
  category: z.string().optional(),
  site_id: z.string().optional(),
  contractor_id: z.string().optional(),
  wage_rate: z.number().default(0),
  overtime_rate: z.number().default(0),
  shift: z.string().optional(),
  status: z.enum(['active', 'inactive', 'terminated']).default('active'),
  photo: z.string().optional(),
  join_date: z.string().optional(),
  skill_level: z.string().optional(),
  pin: z.string().optional(),
});

export const AttendanceSchema = z.object({
  id: z.string().optional(),
  worker_id: z.string(),
  site_id: z.string(),
  date: z.string(),
  status: z.enum(['present', 'absent', 'half-day', 'leave']),
  time_in: z.string().optional(),
  time_out: z.string().optional(),
  overtime_hours: z.number().default(0),
  supervisor_id: z.string().optional(),
  gps_location: z.string().optional(),
  notes: z.string().optional(),
  verification_method: z.string().optional(),
});

export const PaymentSchema = z.object({
  id: z.string().optional(),
  worker_id: z.string(),
  amount: z.number(),
  date: z.string(),
  type: z.enum(['salary', 'advance', 'bonus', 'settlement']),
  payment_mode: z.string().optional(),
  reference_no: z.string().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).default('completed'),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
  notes: z.string().optional(),
  deductions: z.number().default(0).optional(),
  bonuses: z.number().default(0).optional(),
});
