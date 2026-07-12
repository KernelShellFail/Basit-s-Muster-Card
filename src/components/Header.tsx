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

export const Header = () => {
  const { 
    currentUser, 
    selectedRole, 
    activeSiteId, 
    setActiveSite, 
    currentLanguage, 
    setLanguage, 
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
    <header className="h-16 border-b border-border bg-background/60 backdrop-blur-xl px-6 flex items-center justify-between shrink-0 z-40 relative">
      
      {/* Left: Site Selector (for Owner/Admin) */}
      <div className="flex items-center gap-3">
        {(selectedRole === 'owner' || selectedRole === 'admin') ? (
          <div className="flex items-center gap-2 group cursor-pointer p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <Map className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <select
              value={activeSiteId}
              onChange={(e) => setActiveSite(e.target.value)}
              className="bg-transparent text-sm font-semibold text-foreground border-none focus:ring-0 focus:outline-none cursor-pointer appearance-none"
            >
              {sites.map(s => (
                <option key={s.id} value={s.id} className="text-foreground bg-background">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2">
            <Map className="w-5 h-5 text-brand-500" />
            <span className="text-sm font-semibold text-foreground">
              {sites.find(s => s.id === activeSiteId)?.name || 'All Sites'}
            </span>
          </div>
        )}
      </div>

      {/* Right: Tools & Utilities */}
      <div className="flex items-center gap-3 md:gap-4">
        
        {/* Real-time Status Dot */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-[11px] font-medium text-muted-foreground">
          <span className={cn("w-2 h-2 rounded-full pulse-dot", isOnline ? "bg-emerald-500" : "bg-amber-500")} />
          {isOnline ? 'Live Sync' : 'Offline Mode'}
        </div>

        {/* Network Icon */}
        <div className="hidden md:block">
          {isOnline ? <Wifi className="w-5 h-5 text-brand-500" /> : <WifiOff className="w-5 h-5 text-destructive" />}
        </div>

        {/* Language Selection */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            aria-label="Select language"
            className="p-1.5 px-3 rounded-full border border-border bg-card text-foreground flex items-center gap-2 transition-all hover:bg-muted"
          >
            <Globe className="w-5 h-5 text-brand-500" />
            <span className="text-xs font-semibold">
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
                className="absolute right-0 mt-2 w-40 rounded-xl border border-border bg-card/90 backdrop-blur-xl shadow-premium overflow-hidden py-1 origin-top-right z-50"
              >
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as any);
                      setShowLangMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 text-xs text-left font-medium hover:bg-accent/50 transition-colors"
                  >
                    <span>{lang.name}</span>
                    {currentLanguage === lang.code && <Check className="w-5 h-5 text-brand-500" />}
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
            className="p-2 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground relative transition-all duration-300"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                variants={scaleUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card/90 backdrop-blur-xl shadow-premium overflow-hidden py-1 z-50 origin-top-right"
              >
                <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/20">
                  <span className="text-xs font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={clearNotifications}
                      className="text-[10px] font-semibold text-brand-500 hover:text-brand-400"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Bell className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                      <span className="text-xs text-muted-foreground">No new alerts</span>
                    </div>
                  ) : (
                    notifications.map((notif, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={notif.id} 
                        className={cn(
                          "px-4 py-3 border-b border-border/50 hover:bg-accent/30 transition-all cursor-pointer relative",
                          !notif.read && "bg-brand-500/5"
                        )}
                      >
                        {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-500" />}
                        <p className="text-xs font-semibold">{notif.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{notif.message}</p>
                        <p className="text-[9px] text-muted-foreground/60 mt-2 font-medium">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 border-l border-border pl-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-400 to-brand-600 text-black flex items-center justify-center font-bold text-xs shadow-sm">
            {currentUser?.name.substring(0, 2).toUpperCase() || 'MM'}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-sm font-semibold truncate max-w-[120px] leading-tight">
              {currentUser?.name || 'User'}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground leading-tight">
              {selectedRole}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};
