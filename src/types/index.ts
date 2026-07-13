export type Role = 'owner' | 'admin' | 'supervisor' | 'labour';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  siteId?: string;
  organizationId?: string;
  workerId?: string;
  password?: string;
}

export type AttendanceStatus = 
  | 'Present' 
  | 'Half-Day' 
  | 'Absent' 
  | 'Paid-Leave' 
  | 'Unpaid-Leave' 
  | 'Holiday' 
  | 'Weekly-Off';

export interface LabourSubmission {
  id: string;
  workerId: string;
  date: string;
  status: AttendanceStatus;
  isNightShift: boolean;
  overtimeHours: number;
  timeIn?: string;
  timeOut?: string;
  remarks?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  logo: string;
  gstNumber: string;
  address: string;
  phone: string;
  email: string;
  ownerId: string;
}

export interface Site {
  id: string;
  name: string;
  address: string;
  gpsCoordinates: string;
  status: 'active' | 'completed' | 'on-hold';
  supervisorId: string;
  workersCount: number;
}

export interface Worker {
  id: string;
  name: string;
  fatherName: string;
  gender: string;
  dob: string;
  phone: string;
  emergencyContact: string;
  address: string;
  village: string;
  district: string;
  state: string;
  pinCode: string;
  aadhaar: string;
  pan: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  joiningDate: string;
  trade: string;
  department: string;
  skillLevel: 'Helper' | 'Semi-Skilled' | 'Skilled' | 'Highly-Skilled';
  dailyWage: number;
  overtimeRate: number;
  currentSiteId: string;
  status: 'Active' | 'Inactive';
  photo: string;
  documents: { type: string; url: string }[];
  notes: string;
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  date: string;
  status: AttendanceStatus;
  isNightShift: boolean;
  overtimeHours: number;
  timeIn?: string;
  timeOut?: string;
  gpsCoordinates?: string;
  photoProof?: string;
  supervisorId: string;
  siteId: string;
  remarks?: string;
}

export interface LeaveRequest {
  id: string;
  workerId: string;
  workerName: string;
  leaveType: 'Medical' | 'Personal' | 'Emergency' | 'Paid' | 'Unpaid';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  comment?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  workerId: string;
  workerName: string;
  date: string;
  amount: number;
  paymentType: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque';
  referenceNumber?: string;
  type: 'Wage' | 'Advance' | 'Bonus' | 'Deduction';
  workerSignature?: string;
  supervisorSignature?: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  siteId: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  text: string;
  imageUrl?: string;
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read: boolean;
}
