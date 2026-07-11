import { create } from 'zustand';
import { LocalDB, UserProfile, Role, Site, Worker, SystemNotification, ChatMessage, Organization, AttendanceRecord, PaymentRecord, LeaveRequest, LabourSubmission } from '../services/db';
import { showToast } from '../components/Toast';

interface AppState {
  currentUser: UserProfile | null;
  selectedRole: Role;
  activeSiteId: string;
  activeWorkerId: string | null;
  currentLanguage: 'en' | 'hi' | 'mr' | 'gu' | 'ta';
  isDarkMode: boolean;
  
  // Data lists synced from LocalDB
  organization: Organization | null;
  users: UserProfile[];
  sites: Site[];
  workers: Worker[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  leaves: LeaveRequest[];
  notifications: SystemNotification[];
  chatMessages: ChatMessage[];
  labourSubmissions: LabourSubmission[];
  
  // Actions
  initApp: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  setActiveSite: (siteId: string) => void;
  setActiveWorker: (workerId: string | null) => void;
  setLanguage: (lang: 'en' | 'hi' | 'mr' | 'gu' | 'ta') => void;
  toggleDarkMode: () => void;
  
  // Database update proxy triggers (updates LocalDB and syncs Zustand)
  refreshData: () => Promise<void>;
  updateOrganization: (org: Organization) => Promise<void>;
  addWorker: (worker: Worker) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  addSite: (site: Site) => Promise<void>;
  saveAttendance: (records: any[]) => Promise<void>;
  processPayment: (payment: any) => Promise<void>;
  saveLeave: (leave: any) => Promise<void>;
  sendChatMessage: (text: string, imageUrl?: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  addUser: (user: UserProfile) => Promise<void>;
  removeUser: (uid: string) => Promise<void>;
  removeSite: (id: string) => Promise<void>;
  removePayment: (id: string) => Promise<void>;
  loginUser: (loginId: string, password: string) => Promise<boolean>;
  registerUser: (ownerData: any) => Promise<boolean>;
  logoutUser: () => Promise<void>;
  submitLabourAttendance: (claim: LabourSubmission) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  selectedRole: 'owner',
  activeSiteId: 'site-01',
  activeWorkerId: null,
  currentLanguage: 'en',
  isDarkMode: false,
  
  organization: null,
  users: [],
  sites: [],
  workers: [],
  attendance: [],
  payments: [],
  leaves: [],
  notifications: [],
  chatMessages: [],
  labourSubmissions: [],

  initApp: async () => {
    await LocalDB.init();
    
    const loadedUsers = await LocalDB.getUsers();
    
    // Attempt session loading
    const session = localStorage.getItem('mm_session_user');
    const sessionUser = session ? (JSON.parse(session) as UserProfile) : null;
    
    const isDark = localStorage.getItem('mm_dark_mode') === 'true';
    const lang = (localStorage.getItem('mm_lang') || 'en') as 'en' | 'hi' | 'mr' | 'gu' | 'ta';
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    const org = await LocalDB.getOrganization();
    const sitesList = await LocalDB.getSites();
    const workersList = await LocalDB.getWorkers();
    const attendanceList = await LocalDB.getAttendance();
    const paymentsList = await LocalDB.getPayments();
    const leavesList = await LocalDB.getLeaves();
    const notificationsList = await LocalDB.getNotifications();
    
    const siteChatId = sessionUser?.role === 'labour' || sessionUser?.role === 'supervisor' 
      ? (sessionUser.siteId || 'site-01') 
      : 'global';
    const chatList = await LocalDB.getChat(siteChatId);
    
    const labourSubs = await LocalDB.getLabourSubmissions();

    set({
      currentUser: sessionUser,
      selectedRole: sessionUser ? sessionUser.role : 'owner',
      activeSiteId: sessionUser?.siteId || 'site-01',
      isDarkMode: isDark,
      currentLanguage: lang,
      organization: org,
      users: loadedUsers,
      sites: sitesList,
      workers: workersList,
      attendance: attendanceList,
      payments: paymentsList,
      leaves: leavesList,
      notifications: notificationsList,
      chatMessages: chatList,
      labourSubmissions: labourSubs
    });
  },

  setUser: (user) => {
    if (user) {
      set({ currentUser: user, selectedRole: user.role, activeSiteId: user.siteId || 'site-01' });
    } else {
      set({ currentUser: null });
    }
  },



  setActiveSite: (siteId) => {
    set({ activeSiteId: siteId });
  },

  setActiveWorker: (workerId) => {
    set({ activeWorkerId: workerId });
  },

  setLanguage: (lang) => {
    localStorage.setItem('mm_lang', lang);
    set({ currentLanguage: lang });
  },

  toggleDarkMode: () => {
    const isDark = !get().isDarkMode;
    localStorage.setItem('mm_dark_mode', String(isDark));
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    set({ isDarkMode: isDark });
  },

  refreshData: async () => {
    const role = get().selectedRole;
    const user = get().currentUser;
    const siteChatId = role === 'labour' || role === 'supervisor' ? (user?.siteId || 'site-01') : 'global';
    
    const org = await LocalDB.getOrganization();
    const loadedUsers = await LocalDB.getUsers();
    const sitesList = await LocalDB.getSites();
    const workersList = await LocalDB.getWorkers();
    const attendanceList = await LocalDB.getAttendance();
    const paymentsList = await LocalDB.getPayments();
    const leavesList = await LocalDB.getLeaves();
    const notificationsList = await LocalDB.getNotifications();
    const chatList = await LocalDB.getChat(siteChatId);

    const labourSubs = await LocalDB.getLabourSubmissions();

    set({
      organization: org,
      users: loadedUsers,
      sites: sitesList,
      workers: workersList,
      attendance: attendanceList,
      payments: paymentsList,
      leaves: leavesList,
      notifications: notificationsList,
      chatMessages: chatList
    });
  },

  updateOrganization: async (org) => {
    await LocalDB.saveOrganization(org);
    await get().refreshData();
  },

  addWorker: async (worker) => {
    await LocalDB.saveWorker(worker);
    await get().refreshData();
  },

  deleteWorker: async (id) => {
    await LocalDB.deleteWorker(id);
    await get().refreshData();
  },

  addSite: async (site) => {
    await LocalDB.saveSite(site);
    await get().refreshData();
  },

  saveAttendance: async (records) => {
    await LocalDB.saveAttendanceRecords(records);
    await get().refreshData();
  },

  processPayment: async (payment) => {
    await LocalDB.savePayment(payment);
    await get().refreshData();
  },

  saveLeave: async (leave) => {
    await LocalDB.saveLeaveRequest(leave);
    await get().refreshData();
  },

  sendChatMessage: async (text, imageUrl) => {
    const role = get().selectedRole;
    const user = get().currentUser;
    const siteId = role === 'labour' || role === 'supervisor' ? (user?.siteId || 'site-01') : 'global';
    
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      siteId,
      senderId: user?.uid || 'usr-anon',
      senderName: user?.name || 'Anonymous User',
      senderRole: role,
      text,
      imageUrl,
      createdAt: new Date().toISOString()
    };
    
    await LocalDB.addChatMessage(message);
    const chat = await LocalDB.getChat(siteId);
    set({ chatMessages: chat });
  },

  clearNotifications: async () => {
    await LocalDB.markNotificationsRead();
    await get().refreshData();
  },

  addUser: async (user) => {
    await LocalDB.saveUser(user);
    await get().refreshData();
  },

  removeUser: async (uid) => {
    await LocalDB.deleteUser(uid);
    await get().refreshData();
  },

  removeSite: async (id) => {
    await LocalDB.deleteSite(id);
    await get().refreshData();
  },

  removePayment: async (id) => {
    await LocalDB.deletePayment(id);
    await get().refreshData();
  },

  loginUser: async (loginId, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
      }
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('mm_session_user', JSON.stringify(data.user));
        set({ 
          currentUser: data.user, 
          selectedRole: data.user.role, 
          activeSiteId: data.user.siteId || 'site-01' 
        });
        await get().refreshData();
        showToast(`Welcome back, ${data.user.name}!`, 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
      return false;
    }
  },

  registerUser: async (ownerData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ownerData)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Registration failed');
      }
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('mm_session_user', JSON.stringify(data.user));
        set({ 
          currentUser: data.user, 
          selectedRole: data.user.role, 
          activeSiteId: data.user.siteId || 'site-01' 
        });
        await get().refreshData();
        showToast('Registration successful! Organization profile set up.', 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
      return false;
    }
  },

  logoutUser: async () => {
    localStorage.removeItem('mm_session_user');
    set({ 
      currentUser: null,
      selectedRole: 'owner',
      activeWorkerId: null
    });
    showToast('Logged out successfully.');
  },

  submitLabourAttendance: async (claim) => {
    await LocalDB.saveLabourSubmission(claim);
    await get().refreshData();
  }
}));
