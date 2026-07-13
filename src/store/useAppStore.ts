import { create } from 'zustand';
import { LocalDB, UserProfile, Role, Site, Worker, SystemNotification, ChatMessage, Organization, AttendanceRecord, PaymentRecord, LeaveRequest, LabourSubmission } from '../services/db';
import { showToast } from '../components/Toast';

interface AppState {
  currentUser: UserProfile | null;
  selectedRole: Role;
  activeSiteId: string;
  activeWorkerId: string | null;
  currentLanguage: 'en' | 'hi' | 'mr' | 'gu' | 'ta';
  
  // Actions
  initApp: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  setActiveSite: (siteId: string) => void;
  setActiveWorker: (workerId: string | null) => void;
  setLanguage: (lang: 'en' | 'hi' | 'mr' | 'gu' | 'ta') => void;
  
  // Database update proxy triggers
  refreshData: () => Promise<void>;
  
  loginUser: (loginId: string, password: string) => Promise<boolean>;
  registerUser: (ownerData: any) => Promise<boolean>;
  logoutUser: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  selectedRole: 'owner',
  activeSiteId: 'site-01',
  activeWorkerId: null,
  currentLanguage: 'en',

  initApp: async () => {
    await LocalDB.init();
    
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

    set({
      currentUser: sessionUser,
      selectedRole: sessionUser ? sessionUser.role : 'owner',
      activeSiteId: sessionUser?.siteId || 'site-01',
      currentLanguage: lang
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

  refreshData: async () => {
    // Left empty since we moved data fetching to react-query.
    // Auth functions still call this, so we leave a stub to prevent errors.
  },

  loginUser: async (loginId, password) => {
    try {
      let user: UserProfile | null = null;
      if (loginId === 'owner123' || loginId === 'owner@mustermate.com') {
        user = { uid: 'usr-owner', name: 'Rajesh Singhania', email: 'owner@mustermate.com', phone: '9876543210', role: 'owner', organizationId: 'org-101' };
      } else if (loginId === 'super123') {
        user = { uid: 'usr-super1', name: 'Ramesh Kamble', email: 'super@mustermate.com', phone: '9876543211', role: 'supervisor', organizationId: 'org-101', siteId: 'site-01' };
      } else {
        throw new Error('Invalid credentials');
      }

      localStorage.setItem('mm_session_user', JSON.stringify(user));
      localStorage.setItem('mm_token', 'mock-jwt-token');
      set({ 
        currentUser: user, 
        selectedRole: user.role, 
        activeSiteId: user.siteId || 'site-01' 
      });
      await get().refreshData();
      showToast(`Welcome back, ${user.name}!`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
      return false;
    }
  },

  registerUser: async (ownerData) => {
    try {
      const user: UserProfile = {
        uid: `usr-owner-${Date.now()}`,
        name: ownerData.name,
        email: ownerData.email,
        phone: ownerData.phone,
        role: 'owner',
        organizationId: `org-${Date.now()}`
      };
      
      localStorage.setItem('mm_session_user', JSON.stringify(user));
      localStorage.setItem('mm_token', 'mock-jwt-token-register');
      set({ 
        currentUser: user, 
        selectedRole: user.role, 
        activeSiteId: 'site-01' 
      });
      await get().refreshData();
      showToast('Registration successful! Organization profile set up.', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
      return false;
    }
  },

  logoutUser: async () => {
    localStorage.removeItem('mm_session_user');
    localStorage.removeItem('mm_token');
    set({ 
      currentUser: null,
      selectedRole: 'owner',
      activeWorkerId: null
    });
    showToast('Logged out successfully.');
  }
}));
