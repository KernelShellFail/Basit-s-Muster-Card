// MusterMate Database Service Adapter
// Connects to Express + PostgreSQL API backend with LocalStorage fallback.

export type Role = 'owner' | 'admin' | 'supervisor' | 'labour';

export interface UserProfile {
  uid: string;
  name: string;
  username?: string;
  email: string;
  phone: string;
  role: Role;
  siteId?: string;
  organizationId?: string;
  workerId?: string;
  password?: string;
  photo?: string;
}

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

export type AttendanceStatus = 
  | 'Present' 
  | 'Half-Day' 
  | 'Absent' 
  | 'Paid-Leave' 
  | 'Unpaid-Leave' 
  | 'Holiday' 
  | 'Weekly-Off';

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
  type: 'info' | 'success' | 'warning' | 'error' | 'payment' | 'invoice' | 'customer';
  link?: string;
  createdAt: string;
  read: boolean;
}

// Check server status
let isBackendOnline = false;
let lastHealthCheckAt = 0;

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('mm_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers = {
    ...options.headers,
    ...getAuthHeaders(),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errorMessage = `HTTP error! status: ${res.status}`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      // ignore JSON parse error
    }
    throw new Error(errorMessage);
  }
  return res;
};

const checkServer = async (): Promise<boolean> => {
  const now = Date.now();
  if (now - (lastHealthCheckAt || 0) < 10_000) {
    return isBackendOnline;
  }
  try {
    const res = await fetch('/api/health');
    isBackendOnline = res.ok;
    lastHealthCheckAt = Date.now();
    return isBackendOnline;
  } catch {
    isBackendOnline = false;
    lastHealthCheckAt = Date.now();
    return false;
  }
};

// Session helpers for offline fallbacks. The backend is the source of truth
// when online; localStorage is only a read cache when the server is down.
// Writes are never queued locally — offline writes fail loudly so no data is
// silently lost and no PII is persisted in plaintext localStorage.
const getSessionOrgId = (): string => {
  const session = localStorage.getItem('mm_session_user');
  if (!session) return '';
  try {
    return (JSON.parse(session) as UserProfile).organizationId || '';
  } catch {
    return '';
  }
};

const requireOnlineForWrite = async (): Promise<void> => {
  if (!(await checkServer())) {
    throw new Error("You're offline. Connect to the internet to save changes.");
  }
};

export const LocalDB = {
  // Initialization
  async init() {
    await checkServer();
    if (!isBackendOnline) {
      console.warn('Backend server offline. Showing cached data; saving is unavailable until the connection returns.');
    } else {
      console.log('Connected to Express + PostgreSQL Backend.');
    }
  },

  isOnline() {
    return isBackendOnline;
  },

  // Organizations
  async getOrganization(): Promise<Organization> {
    if (await checkServer()) {
      const res = await authenticatedFetch('/api/organization');
      return res.json();
    }
    const local = localStorage.getItem('mm_org');
    if (local) return JSON.parse(local);
    const orgId = getSessionOrgId();
    return { id: orgId, name: 'My Organization', logo: '', gstNumber: '', address: '', phone: '', email: '', ownerId: '' };
  },

  async saveOrganization(org: Organization): Promise<void> {
    await requireOnlineForWrite();
    await authenticatedFetch('/api/organization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(org)
    });
  },

  // Users
  async getUsers(): Promise<UserProfile[]> {
    if (await checkServer()) {
      const res = await authenticatedFetch('/api/users');
      return res.json();
    }
    const local = localStorage.getItem('mm_users');
    return local ? JSON.parse(local) : [];
  },

  // Workers
  async getWorkers(): Promise<Worker[]> {
    if (await checkServer()) {
      const res = await authenticatedFetch('/api/workers');
      return res.json();
    }
    const local = localStorage.getItem('mm_workers');
    return local ? JSON.parse(local) : [];
  },

  async saveWorker(worker: Worker): Promise<void> {
    await requireOnlineForWrite();
    await authenticatedFetch('/api/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(worker)
    });
  },

  async deleteWorker(id: string): Promise<void> {
    await requireOnlineForWrite();
    await authenticatedFetch(`/api/workers/${id}`, { method: 'DELETE' });
  },

  // Sites
  async getSites(): Promise<Site[]> {
    if (await checkServer()) {
      const res = await authenticatedFetch('/api/sites');
      return res.json();
    }
    const local = localStorage.getItem('mm_sites');
    return local ? JSON.parse(local) : [];
  },

  async saveSite(site: Site): Promise<void> {
    await requireOnlineForWrite();
    await authenticatedFetch('/api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(site)
    });
  },

  // Attendance
  async getAttendance(): Promise<AttendanceRecord[]> {
    if (await checkServer()) {
      const res = await authenticatedFetch('/api/attendance');
      return res.json();
    }
    const local = localStorage.getItem('mm_attendance');
    return local ? JSON.parse(local) : [];
  },

  async saveAttendanceRecords(records: AttendanceRecord[]): Promise<void> {
    await requireOnlineForWrite();
    await authenticatedFetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(records)
    });
  },

  // Leaves
  async getLeaves(): Promise<LeaveRequest[]> {
    if (await checkServer()) {
      const res = await authenticatedFetch('/api/leaves');
      return res.json();
    }
    const local = localStorage.getItem('mm_leaves');
    return local ? JSON.parse(local) : [];
  },

  async saveLeaveRequest(request: LeaveRequest): Promise<void> {
    await requireOnlineForWrite();
    await authenticatedFetch('/api/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
  },

  // Payments
  async getPayments(): Promise<PaymentRecord[]> {
    if (await checkServer()) {
      const res = await authenticatedFetch('/api/payments');
      return res.json();
    }
    const local = localStorage.getItem('mm_payments');
    return local ? JSON.parse(local) : [];
  },

  async savePayment(payment: PaymentRecord): Promise<void> {
    await requireOnlineForWrite();
    await authenticatedFetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment)
    });
  },

  // Notifications
  async getNotifications(): Promise<SystemNotification[]> {
    if (await checkServer()) {
      const res = await authenticatedFetch('/api/notifications');
      return res.json();
    }
    const local = localStorage.getItem('mm_notifications');
    return local ? JSON.parse(local) : [];
  },

  async markNotificationsRead(): Promise<void> {
    await requireOnlineForWrite();
    await authenticatedFetch('/api/notifications/read', { method: 'POST' });
  },

  async markNotificationRead(id: string): Promise<void> {
    await requireOnlineForWrite();
    await authenticatedFetch(`/api/notifications/${id}/read`, { method: 'POST' });
  },

  async createNotification(notif: Omit<SystemNotification, 'id' | 'createdAt' | 'read'> & { id?: string; createdAt?: string }): Promise<void> {
    const payload = {
      ...notif,
      id: notif.id || `notif-${Date.now()}`,
      createdAt: notif.createdAt || new Date().toISOString(),
      read: false,
    };
    await requireOnlineForWrite();
    await authenticatedFetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: payload.title, message: payload.message, type: payload.type, link: payload.link })
    });
  },

  // Chat
  async getChat(siteId: string): Promise<ChatMessage[]> {
    if (await checkServer()) {
      const res = await authenticatedFetch(`/api/chat/${siteId}`);
      return res.json();
    }
    const chat = localStorage.getItem('mm_chat') ? JSON.parse(localStorage.getItem('mm_chat') || '[]') : [];
    return chat.filter((c: any) => c.siteId === siteId);
  },

  async addChatMessage(msg: ChatMessage): Promise<void> {
    await requireOnlineForWrite();
    await authenticatedFetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    });
  },

  async saveUser(user: UserProfile): Promise<void> {
    await requireOnlineForWrite();
    await authenticatedFetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
  },

  async deleteUser(uid: string): Promise<void> {
    await requireOnlineForWrite();
    await authenticatedFetch(`/api/users/${uid}`, { method: 'DELETE' });
  },

  async deleteSite(id: string): Promise<void> {
    await requireOnlineForWrite();
    await authenticatedFetch(`/api/sites/${id}`, { method: 'DELETE' });
  },

  async deletePayment(id: string): Promise<void> {
    await requireOnlineForWrite();
    await authenticatedFetch(`/api/payments/${id}`, { method: 'DELETE' });
  },

  async getLabourSubmissions(): Promise<LabourSubmission[]> {
    if (await checkServer()) {
      const res = await authenticatedFetch('/api/labour/submissions');
      return res.json();
    }
    const local = localStorage.getItem('mm_labour_subs');
    return local ? JSON.parse(local) : [];
  },

  async saveLabourSubmission(submission: LabourSubmission): Promise<void> {
    await requireOnlineForWrite();
    await authenticatedFetch('/api/labour/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });
  }
};
