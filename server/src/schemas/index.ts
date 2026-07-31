import { z } from 'zod';

// NOTE: Schemas validate the camelCase payloads the frontend sends.
// `.passthrough()` preserves any unknown keys so controllers receive the full body.

export const OrganizationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  logo: z.string().optional(),
  gstNumber: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  ownerId: z.string().optional(),
}).passthrough();

export const UserSchema = z.object({
  uid: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(['owner', 'admin', 'supervisor', 'labour', 'viewer']),
  siteId: z.string().optional(),
  organizationId: z.string().optional(),
  workerId: z.string().optional(),
  password: z.string().optional(),
}).passthrough();

export const SiteSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  gpsCoordinates: z.string().optional(),
  status: z.enum(['active', 'completed', 'on-hold']).default('active'),
  supervisorId: z.string().optional(),
  workersCount: z.coerce.number().default(0).optional(),
}).passthrough();

export const WorkerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  fatherName: z.string().optional(),
  gender: z.string().optional(),
  dob: z.string().optional(),
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
  address: z.string().optional(),
  village: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  aadhaar: z.string().optional(),
  pan: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  upiId: z.string().optional(),
  joiningDate: z.string().optional(),
  trade: z.string().optional(),
  department: z.string().optional(),
  skillLevel: z.string().optional(),
  dailyWage: z.coerce.number().optional(),
  overtimeRate: z.coerce.number().optional(),
  currentSiteId: z.string().optional(),
  status: z.string().optional(),
  photo: z.string().optional(),
  notes: z.string().optional(),
}).passthrough();

export const AttendanceSchema = z.object({
  id: z.string().optional(),
  workerId: z.string(),
  date: z.string(),
  status: z.string().min(1),
  isNightShift: z.boolean().optional(),
  overtimeHours: z.coerce.number().optional(),
  timeIn: z.string().optional(),
  timeOut: z.string().optional(),
  gpsCoordinates: z.string().optional(),
  photoProof: z.string().optional(),
  supervisorId: z.string().optional(),
  siteId: z.string(),
  remarks: z.string().optional(),
}).passthrough();

export const PaymentSchema = z.object({
  id: z.string().optional(),
  workerId: z.string(),
  workerName: z.string().optional(),
  date: z.string(),
  amount: z.coerce.number(),
  paymentType: z.string().optional(),
  referenceNumber: z.string().optional(),
  type: z.string().optional(),
  workerSignature: z.string().optional(),
  supervisorSignature: z.string().optional(),
  notes: z.string().optional(),
}).passthrough();

export const LeaveSchema = z.object({
  id: z.string().optional(),
  workerId: z.string(),
  workerName: z.string().optional(),
  leaveType: z.enum(['Medical', 'Personal', 'Emergency', 'Paid', 'Unpaid']),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional(),
  status: z.enum(['Pending', 'Approved', 'Rejected']).default('Pending'),
  comment: z.string().optional(),
  createdAt: z.string().optional(),
}).passthrough();

export const ChatMessageSchema = z.object({
  id: z.string().optional(),
  siteId: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  senderRole: z.string(),
  text: z.string().optional(),
  imageUrl: z.string().optional(),
  createdAt: z.string().optional(),
}).passthrough();

export const LabourSubmissionSchema = z.object({
  id: z.string().optional(),
  workerId: z.string(),
  date: z.string(),
  status: z.string(),
  isNightShift: z.boolean().default(false),
  overtimeHours: z.coerce.number().default(0),
  timeIn: z.string().optional(),
  timeOut: z.string().optional(),
  remarks: z.string().optional(),
  createdAt: z.string().optional(),
}).passthrough();

export const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(6, "Valid phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  organizationName: z.string().min(1, "Organization name is required"),
}).passthrough();

export const LoginSchema = z.object({
  loginId: z.string().min(1, "Login identifier is required"),
  password: z.string().min(1, "Password is required"),
}).passthrough();
