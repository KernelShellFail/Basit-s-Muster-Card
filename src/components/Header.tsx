import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../utils/i18n';
import { 
  Bell, 
  Sun, 
  Moon, 
  Map, 
  Globe, 
  Check, 
  Wifi, 
  WifiOff 
} from 'lucide-react';

export const Header = () => {
  const { 
    currentUser, 
    selectedRole, 
    activeSiteId, 
    setActiveSite, 
    currentLanguage, 
    setLanguage, 
    isDarkMode, 
    toggleDarkMode, 
    notifications,
    clearNotifications,
    sites
  } = useAppStore();

  const { t } = useTranslation(currentLanguage);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'mr', name: 'मराठी' },
    { code: 'gu', name: 'ગુજરાતી' },
    { code: 'ta', name: 'தமிழ்' }
  ];

  return (
    <header className="h-16 border-b border-construction-200 dark:border-construction-800 bg-white/80 dark:bg-construction-900/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-40 relative">
      
      {/* Left: Site Selector (for Owner/Admin) */}
      <div className="flex items-center gap-3">
        {(selectedRole === 'owner' || selectedRole === 'admin') ? (
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-construction-500" />
            <select
              value={activeSiteId}
              onChange={(e) => setActiveSite(e.target.value)}
              className="bg-transparent text-sm font-bold text-construction-800 dark:text-white border-none py-1 focus:ring-0 focus:outline-none cursor-pointer"
            >
              {sites.map(s => (
                <option key={s.id} value={s.id} className="text-slate-900 dark:text-white bg-white dark:bg-construction-900">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-safety-500" />
            <span className="text-sm font-bold text-construction-800 dark:text-white">
              {sites.find(s => s.id === activeSiteId)?.name || 'All Sites'}
            </span>
          </div>
        )}
      </div>

      {/* Right: Tools & Utilities */}
      <div className="flex items-center gap-4">
        
        {/* Real-time Status Dot */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-construction-100 dark:bg-construction-800 text-[11px] font-semibold text-construction-600 dark:text-construction-400">
          <span className={`w-2 h-2 rounded-full pulse-dot ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {isOnline ? 'Live Cloud Connected' : 'Offline Mode Active'}
        </div>

        {/* Network Icon */}
        <div className="text-construction-500 dark:text-construction-400">
          {isOnline ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-amber-500" />}
        </div>

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-construction-100 dark:hover:bg-construction-800 text-construction-600 dark:text-construction-300 transition-colors"
          aria-label={isDarkMode ? t('lightMode') : t('darkMode')}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Language Selection */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="p-2 px-3 rounded-xl border border-construction-200 dark:border-construction-800 bg-construction-50 dark:bg-construction-950 text-construction-600 dark:text-construction-300 flex items-center gap-2 transition-all hover:bg-construction-100 dark:hover:bg-construction-800"
          >
            <Globe className="w-4 h-4 text-safety-500" />
            <span className="text-xs font-black text-construction-800 dark:text-white">
              {languages.find(l => l.code === currentLanguage)?.name || 'Language'}
            </span>
          </button>
          
          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-40 rounded-xl border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 shadow-xl overflow-hidden py-1">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as any);
                    setShowLangMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-left font-semibold text-construction-800 dark:text-construction-200 hover:bg-construction-100 dark:hover:bg-construction-800/50"
                >
                  <span>{lang.name}</span>
                  {currentLanguage === lang.code && <Check className="w-3.5 h-3.5 text-safety-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-construction-100 dark:hover:bg-construction-800 text-construction-600 dark:text-construction-300 relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-extrabold shadow-sm shrink-0">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 shadow-xl overflow-hidden py-1 z-50">
              <div className="px-4 py-2 border-b border-construction-200 dark:border-construction-800 flex items-center justify-between bg-construction-50 dark:bg-construction-900/50">
                <span className="text-xs font-bold text-construction-800 dark:text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={clearNotifications}
                    className="text-[10px] font-bold text-safety-600 hover:text-safety-500 dark:text-safety-500"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-construction-500">
                    No new alerts.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`px-4 py-3 border-b border-construction-100 dark:border-construction-800/40 hover:bg-construction-50/50 dark:hover:bg-construction-800/20 transition-all ${
                        !notif.read ? 'bg-safety-500/5 dark:bg-safety-500/5 border-l-2 border-l-safety-500' : ''
                      }`}
                    >
                      <p className="text-xs font-bold text-construction-800 dark:text-white">{notif.title}</p>
                      <p className="text-[11px] text-construction-600 dark:text-construction-400 mt-0.5 leading-tight">{notif.message}</p>
                      <p className="text-[9px] text-construction-400 mt-1">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 border-l border-construction-200 dark:border-construction-800 pl-4">
          <div className="w-8 h-8 rounded-full bg-safety-500 text-construction-950 flex items-center justify-center font-bold text-xs shadow-md">
            {currentUser?.name.substring(0, 2).toUpperCase() || 'MM'}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-bold text-construction-800 dark:text-white truncate max-w-[120px]">
              {currentUser?.name || 'MusterMate User'}
            </span>
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-construction-500">
              {selectedRole}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};
