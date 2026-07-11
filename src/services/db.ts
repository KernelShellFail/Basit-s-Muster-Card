// MusterMate Database Service Adapter
// Connects to Express + PostgreSQL API backend with LocalStorage fallback.

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
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read: boolean;
}

// Check server status
let isBackendOnline = false;

const checkServer = async (): Promise<boolean> => {
  try {
    const res = await fetch('/api/organization');
    isBackendOnline = res.ok;
    return isBackendOnline;
  } catch {
    isBackendOnline = false;
    return false;
  }
};

// Seeding Fallback LocalDB Data
const fallbackSeed = () => {
  if (!localStorage.getItem('mm_seeded')) {
    const DEFAULT_ORGANIZATION: Organization = {
      id: 'org-101',
      name: 'MusterMate Buildcon Private (Demo)',
      logo: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=150&q=80',
      gstNumber: '27AADCM3241F1ZH',
      address: '402, Metro Plaza, Sector 15, Vashi, Navi Mumbai, MH, 400703',
      phone: '+91 22 2781 9090',
      email: 'ops@mmbuildcon.com',
      ownerId: 'usr-owner'
    };
    localStorage.setItem('mm_org', JSON.stringify(DEFAULT_ORGANIZATION));
    localStorage.setItem('mm_seeded', 'true');
  }
};

export const LocalDB = {
  // Initialization
  async init() {
    await checkServer();
    if (!isBackendOnline) {
      fallbackSeed();
      console.warn('Backend server offline. Running in Local Storage Demo Mode.');
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
      const res = await fetch('/api/organization');
      return res.json();
    }
    const local = localStorage.getItem('mm_org');
    return local ? JSON.parse(local) : { id: 'org-101', name: 'Demo Client', logo: '', gstNumber: '', address: '', phone: '', email: '', ownerId: 'usr-owner' };
  },

  async saveOrganization(org: Organization): Promise<void> {
    if (await checkServer()) {
      await fetch('/api/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(org)
      });
      return;
    }
    localStorage.setItem('mm_org', JSON.stringify(org));
  },

  // Users
  async getUsers(): Promise<UserProfile[]> {
    if (await checkServer()) {
      const res = await fetch('/api/users');
      return res.json();
    }
    // Static fallback users
    return [
      { uid: 'usr-owner', name: 'Rajesh Singhania', email: 'owner@mustermate.com', phone: '+91 9876543210', role: 'owner' },
      { uid: 'usr-admin', name: 'Amit Sharma', email: 'admin@mustermate.com', phone: '+91 9876543211', role: 'admin' },
      { uid: 'usr-super1', name: 'Satish Kamble', email: 'satish@mustermate.com', phone: '+91 9876543212', role: 'supervisor', siteId: 'site-01' },
      { uid: 'usr-super2', name: 'Dinesh Patel', email: 'dinesh@mustermate.com', phone: '+91 9876543213', role: 'supervisor', siteId: 'site-02' },
      { uid: 'usr-labour', name: 'Ramesh Yadav', email: 'ramesh@mustermate.com', phone: '+91 9876543214', role: 'labour', siteId: 'site-01' },
    ];
  },

  // Workers
  async getWorkers(): Promise<Worker[]> {
    if (await checkServer()) {
      const res = await fetch('/api/workers');
      return res.json();
    }
    const local = localStorage.getItem('mm_workers');
    return local ? JSON.parse(local) : [];
  },

  async saveWorker(worker: Worker): Promise<void> {
    if (await checkServer()) {
      await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(worker)
      });
      return;
    }
    const workers = await this.getWorkers();
    const index = workers.findIndex(w => w.id === worker.id);
    if (index >= 0) workers[index] = worker;
    else workers.push(worker);
    localStorage.setItem('mm_workers', JSON.stringify(workers));
  },

  async deleteWorker(id: string): Promise<void> {
    if (await checkServer()) {
      await fetch(`/api/workers/${id}`, { method: 'DELETE' });
      return;
    }
    const workers = await this.getWorkers();
    localStorage.setItem('mm_workers', JSON.stringify(workers.filter(w => w.id !== id)));
  },

  // Sites
  async getSites(): Promise<Site[]> {
    if (await checkServer()) {
      const res = await fetch('/api/sites');
      return res.json();
    }
    const local = localStorage.getItem('mm_sites');
    return local ? JSON.parse(local) : [];
  },

  async saveSite(site: Site): Promise<void> {
    if (await checkServer()) {
      await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(site)
      });
      return;
    }
    const sites = await this.getSites();
    const index = sites.findIndex(s => s.id === site.id);
    if (index >= 0) sites[index] = site;
    else sites.push(site);
    localStorage.setItem('mm_sites', JSON.stringify(sites));
  },

  // Attendance
  async getAttendance(): Promise<AttendanceRecord[]> {
    if (await checkServer()) {
      const res = await fetch('/api/attendance');
      return res.json();
    }
    const local = localStorage.getItem('mm_attendance');
    return local ? JSON.parse(local) : [];
  },

  async saveAttendanceRecords(records: AttendanceRecord[]): Promise<void> {
    if (await checkServer()) {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records)
      });
      return;
    }
    const current = await this.getAttendance();
    records.forEach(newRec => {
      const idx = current.findIndex(r => r.workerId === newRec.workerId && r.date === newRec.date);
      if (idx >= 0) current[idx] = newRec;
      else current.push(newRec);
    });
    localStorage.setItem('mm_attendance', JSON.stringify(current));
  },

  // Leaves
  async getLeaves(): Promise<LeaveRequest[]> {
    if (await checkServer()) {
      const res = await fetch('/api/leaves');
      return res.json();
    }
    const local = localStorage.getItem('mm_leaves');
    return local ? JSON.parse(local) : [];
  },

  async saveLeaveRequest(request: LeaveRequest): Promise<void> {
    if (await checkServer()) {
      await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      return;
    }
    const leaves = await this.getLeaves();
    const index = leaves.findIndex(l => l.id === request.id);
    if (index >= 0) leaves[index] = request;
    else leaves.push(request);
    localStorage.setItem('mm_leaves', JSON.stringify(leaves));
  },

  // Payments
  async getPayments(): Promise<PaymentRecord[]> {
    if (await checkServer()) {
      const res = await fetch('/api/payments');
      return res.json();
    }
    const local = localStorage.getItem('mm_payments');
    return local ? JSON.parse(local) : [];
  },

  async savePayment(payment: PaymentRecord): Promise<void> {
    if (await checkServer()) {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment)
      });
      return;
    }
    const payments = await this.getPayments();
    payments.push(payment);
    localStorage.setItem('mm_payments', JSON.stringify(payments));
  },

  // Notifications
  async getNotifications(): Promise<SystemNotification[]> {
    if (await checkServer()) {
      const res = await fetch('/api/notifications');
      return res.json();
    }
    const local = localStorage.getItem('mm_notifications');
    return local ? JSON.parse(local) : [];
  },

  async markNotificationsRead(): Promise<void> {
    if (await checkServer()) {
      await fetch('/api/notifications/read', { method: 'POST' });
      return;
    }
    const notifs = await this.getNotifications();
    notifs.forEach(n => n.read = true);
    localStorage.setItem('mm_notifications', JSON.stringify(notifs));
  },

  // Chat
  async getChat(siteId: string): Promise<ChatMessage[]> {
    if (await checkServer()) {
      const res = await fetch(`/api/chat/${siteId}`);
      return res.json();
    }
    const chat = localStorage.getItem('mm_chat') ? JSON.parse(localStorage.getItem('mm_chat') || '[]') : [];
    return chat.filter((c: any) => c.siteId === siteId);
  },

  async addChatMessage(msg: ChatMessage): Promise<void> {
    if (await checkServer()) {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      });
      return;
    }
    const chat = localStorage.getItem('mm_chat') ? JSON.parse(localStorage.getItem('mm_chat') || '[]') : [];
    chat.push(msg);
    localStorage.setItem('mm_chat', JSON.stringify(chat));
  },

  async saveUser(user: UserProfile): Promise<void> {
    if (await checkServer()) {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      return;
    }
    const users = await this.getUsers();
    const index = users.findIndex(u => u.uid === user.uid);
    if (index >= 0) users[index] = user;
    else users.push(user);
    localStorage.setItem('mm_users', JSON.stringify(users));
  },

  async deleteUser(uid: string): Promise<void> {
    if (await checkServer()) {
      await fetch(`/api/users/${uid}`, { method: 'DELETE' });
      return;
    }
    const users = await this.getUsers();
    localStorage.setItem('mm_users', JSON.stringify(users.filter(u => u.uid !== uid)));
  },

  async deleteSite(id: string): Promise<void> {
    if (await checkServer()) {
      await fetch(`/api/sites/${id}`, { method: 'DELETE' });
      return;
    }
    const sites = await this.getSites();
    localStorage.setItem('mm_sites', JSON.stringify(sites.filter(s => s.id !== id)));
  },

  async deletePayment(id: string): Promise<void> {
    if (await checkServer()) {
      await fetch(`/api/payments/${id}`, { method: 'DELETE' });
      return;
    }
    const payments = await this.getPayments();
    localStorage.setItem('mm_payments', JSON.stringify(payments.filter(p => p.id !== id)));
  },

  async getLabourSubmissions(): Promise<LabourSubmission[]> {
    if (await checkServer()) {
      const res = await fetch('/api/labour/submissions');
      return res.json();
    }
    const local = localStorage.getItem('mm_labour_subs');
    return local ? JSON.parse(local) : [];
  },

  async saveLabourSubmission(submission: LabourSubmission): Promise<void> {
    if (await checkServer()) {
      await fetch('/api/labour/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      });
      return;
    }
    const subs = await this.getLabourSubmissions();
    const idx = subs.findIndex(s => s.workerId === submission.workerId && s.date === submission.date);
    if (idx >= 0) subs[idx] = submission;
    else subs.push(submission);
    localStorage.setItem('mm_labour_subs', JSON.stringify(subs));
  }
};
