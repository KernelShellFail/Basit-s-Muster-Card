import { create } from 'zustand';
import { LocalDB, UserProfile, Role } from '../services/db';
import { showToast } from '../components/Toast';

interface AppState {
  currentUser: UserProfile | null;
  selectedRole: Role;
  activeSiteId: string;
  activeWorkerId: string | null;
  currentLanguage: 'en' | 'hi' | 'mr' | 'gu' | 'ta';
  isMobileMenuOpen: boolean;
  theme: 'light' | 'dark';
  
  // Actions
  initApp: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  updateCurrentUser: (updates: Partial<UserProfile>) => Promise<void>;
  setActiveSite: (siteId: string) => void;
  setActiveWorker: (workerId: string | null) => void;
  setLanguage: (lang: 'en' | 'hi' | 'mr' | 'gu' | 'ta') => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  
  // Database update proxy triggers
  refreshData: () => Promise<void>;
  
  loginUser: (loginId: string, password: string) => Promise<boolean>;
  registerUser: (ownerData: any) => Promise<boolean>;
  logoutUser: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  selectedRole: 'owner',
  activeSiteId: '',
  activeWorkerId: null,
  currentLanguage: 'en',
  isMobileMenuOpen: false,
  theme: 'dark',

  initApp: async () => {
    await LocalDB.init();
    
    // Attempt session loading
    const session = localStorage.getItem('mm_session_user');
    const sessionUser = session ? (JSON.parse(session) as UserProfile) : null;
    
    // Chalkboard canvas supports light & dark. Default to dark for continuity.
    const savedTheme = localStorage.getItem('mm_theme') as 'light' | 'dark' | null;
    const theme = savedTheme === 'light' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    const lang = (localStorage.getItem('mm_lang') || 'en') as 'en' | 'hi' | 'mr' | 'gu' | 'ta';

    set({
      currentUser: sessionUser,
      selectedRole: sessionUser ? sessionUser.role : 'owner',
      activeSiteId: sessionUser?.siteId || '',
      currentLanguage: lang,
      theme
    });
  },

  setUser: (user) => {
    if (user) {
      set({ currentUser: user, selectedRole: user.role, activeSiteId: user.siteId || '' });
    } else {
      set({ currentUser: null });
    }
  },

  updateCurrentUser: async (updates) => {
    const user = get().currentUser;
    if (!user) return;
    const updated = { ...user, ...updates };
    await LocalDB.saveUser(updated);
    localStorage.setItem('mm_session_user', JSON.stringify(updated));
    set({ currentUser: updated });
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

  setTheme: (theme) => {
    localStorage.setItem('mm_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
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
        activeSiteId: user.siteId || '' 
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
        activeSiteId: user.siteId || '' 
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
