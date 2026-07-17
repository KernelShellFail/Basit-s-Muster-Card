import { create } from 'zustand';
import { LocalDB, UserProfile, Role, Site, Worker, SystemNotification, ChatMessage, Organization, AttendanceRecord, PaymentRecord, LeaveRequest, LabourSubmission } from '../services/db';
import { showToast } from '../components/Toast';

interface AppState {
  currentUser: UserProfile | null;
  selectedRole: Role;
  activeSiteId: string;
  activeWorkerId: string | null;
  currentLanguage: 'en' | 'hi' | 'mr' | 'gu' | 'ta';
  isMobileMenuOpen: boolean;
  
  // Actions
  initApp: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  setActiveSite: (siteId: string) => void;
  setActiveWorker: (workerId: string | null) => void;
  setLanguage: (lang: 'en' | 'hi' | 'mr' | 'gu' | 'ta') => void;
  setMobileMenuOpen: (isOpen: boolean) => void;

  
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
  isMobileMenuOpen: false,

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

  setMobileMenuOpen: (isOpen) => {
    set({ isMobileMenuOpen: isOpen });
  },

  refreshData: async () => {
    // Left empty since we moved data fetching to react-query.
    // Auth functions still call this, so we leave a stub to prevent errors.
  },

  loginUser: async (loginId, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const { user, token } = data;
      localStorage.setItem('mm_session_user', JSON.stringify(user));
      localStorage.setItem('mm_token', token);
      
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ownerData)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      const { user, token } = data;
      localStorage.setItem('mm_session_user', JSON.stringify(user));
      localStorage.setItem('mm_token', token);
      
      set({ 
        currentUser: user, 
        selectedRole: user.role, 
        activeSiteId: user.siteId || 'site-01' 
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
