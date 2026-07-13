import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../utils/i18n';
import { cn } from '../utils/cn';
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
import { scaleUp } from '../utils/animations';
import { useSites, useNotifications, useClearNotifications } from '../api/queries';

export const Header = () => {
  const { 
    currentUser, 
    selectedRole, 
    activeSiteId, 
    setActiveSite, 
    currentLanguage, 
    setLanguage
  } = useAppStore();

  const { data: sites = [] } = useSites();
  const { data: notifications = [] } = useNotifications();
  const { mutate: clearNotifications } = useClearNotifications();

  const { t } = useTranslation(currentLanguage);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

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
    <header className="h-20 bg-background px-8 flex items-center justify-between shrink-0 z-40 relative">
      
      {/* Left: Site Selector (for Owner/Admin) */}
      <div className="flex items-center gap-6">
        {(selectedRole === 'owner' || selectedRole === 'admin') ? (
          <div className="flex items-center gap-2 group cursor-pointer">
            <Map className="w-5 h-5 text-foreground" />
            <select
              value={activeSiteId}
              onChange={(e) => setActiveSite(e.target.value)}
              className="bg-transparent text-[16px] font-medium text-foreground border-none focus:ring-0 focus:outline-none cursor-pointer appearance-none"
            >
              {sites.map(s => (
                <option key={s.id} value={s.id} className="text-foreground bg-background">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-foreground" />
            <span className="text-[16px] font-medium text-foreground">
              {sites.find(s => s.id === activeSiteId)?.name || 'All Sites'}
            </span>
          </div>
        )}
      </div>

      {/* Right: Tools & Utilities */}
      <div className="flex items-center gap-4">
        
        {/* Real-time Status Dot */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium text-muted-foreground uppercase tracking-widest">
          <span className={cn("w-2 h-2 rounded-full pulse-dot", isOnline ? "bg-primary" : "bg-muted-foreground")} />
          {isOnline ? 'Live' : 'Offline'}
        </div>

        {/* Network Icon */}
        <div className="hidden md:block">
          {isOnline ? <Wifi className="w-5 h-5 text-foreground" /> : <WifiOff className="w-5 h-5 text-muted-foreground" />}
        </div>

        {/* Language Selection */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            aria-label="Select language"
            className="px-3 py-2 text-[14px] font-medium text-foreground flex items-center gap-2 transition-all hover:text-muted-foreground bg-transparent"
          >
            <Globe className="w-5 h-5" />
            <span>
              {languages.find(l => l.code === currentLanguage)?.name || 'EN'}
            </span>
          </button>
          
          <AnimatePresence>
            {showLangMenu && (
              <motion.div 
                variants={scaleUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="absolute right-0 mt-2 w-40 rounded-[28px] border-none bg-card shadow-none py-2 origin-top-right z-50 p-2"
              >
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as any);
                      setShowLangMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 text-[14px] text-left font-medium hover:bg-background rounded-full transition-colors text-foreground"
                  >
                    <span>{lang.name}</span>
                    {currentLanguage === lang.code && <Check className="w-5 h-5 text-foreground" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            className="p-2 text-foreground hover:text-muted-foreground relative transition-all duration-300 bg-transparent"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                variants={scaleUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="absolute right-0 mt-2 w-80 rounded-[28px] border-none bg-card shadow-none p-4 z-50 origin-top-right"
              >
                <div className="px-2 py-2 border-b border-border flex items-center justify-between">
                  <span className="text-[12px] uppercase tracking-widest font-medium text-foreground">Alerts</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => clearNotifications()}
                      className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar mt-2 space-y-2">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center flex flex-col items-center gap-2">
                      <span className="text-[14px] text-muted-foreground font-medium">No new alerts</span>
                    </div>
                  ) : (
                    notifications.map((notif, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={notif.id} 
                        className={cn(
                          "p-4 rounded-[18px] bg-background hover:bg-white transition-all cursor-pointer",
                          !notif.read && "border border-primary"
                        )}
                      >
                        <p className="text-[16px] font-medium text-foreground leading-[1.2]">{notif.title}</p>
                        <p className="text-[14px] text-muted-foreground mt-2 leading-[1.5]">{notif.message}</p>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 border-l border-border pl-6 ml-2">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-[16px] font-medium text-foreground truncate max-w-[120px]">
              {currentUser?.name || 'User'}
            </span>
            <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground mt-0.5">
              {selectedRole}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium text-[16px]">
            {currentUser?.name.substring(0, 2).toUpperCase() || 'MM'}
          </div>
        </div>

      </div>
    </header>
  );
};
