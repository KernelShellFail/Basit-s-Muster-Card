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
  WifiOff,
  Menu,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { useSites, useNotifications, useClearNotifications } from '../api/queries';
import { SystemNotification } from '../types';
import { formatDistanceToNow } from 'date-fns';

export const Header = () => {
  const {
    currentUser,
    selectedRole,
    activeSiteId,
    setActiveSite,
    currentLanguage,
    setLanguage,
    setMobileMenuOpen
  } = useAppStore();

  const { data: sites = [] } = useSites();
  const { data: notifications = [] } = useNotifications();
  const { mutate: clearNotifications } = useClearNotifications();

  const { t } = useTranslation(currentLanguage);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showSiteMenu, setShowSiteMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDark, setIsDark] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const siteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem('mm_dark_mode', String(nextDark));
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

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
      const target = event.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (langRef.current && !langRef.current.contains(target)) {
        setShowLangMenu(false);
      }
      if (siteRef.current && !siteRef.current.contains(target)) {
        setShowSiteMenu(false);
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

  const getNotificationIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />;
      default:
        return <Info className="w-5 h-5 text-sky-500 dark:text-sky-400" />;
    }
  };

  const getNotificationStyles = (type: SystemNotification['type']) => {
    switch (type) {
      case 'success':
        return "border border-border/30 border-l-4 border-l-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10";
      case 'warning':
        return "border border-border/30 border-l-4 border-l-amber-500 bg-amber-500/5 hover:bg-amber-500/10 dark:bg-amber-500/5 dark:hover:bg-amber-500/10";
      case 'error':
        return "border border-border/30 border-l-4 border-l-red-500 bg-red-500/5 hover:bg-red-500/10 dark:bg-red-500/5 dark:hover:bg-red-500/10";
      default:
        return "border border-border/30 border-l-4 border-l-sky-500 bg-sky-500/5 hover:bg-sky-500/10 dark:bg-sky-500/5 dark:hover:bg-sky-500/10";
    }
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffInMs = Date.now() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMs < 30000) {
        return 'Just now';
      }
      if (diffInDays === 1) {
        return 'Yesterday';
      }

      const distance = formatDistanceToNow(date, { addSuffix: true });
      return distance
        .replace('less than a minute ago', 'Just now')
        .replace('about ', '')
        .replace('almost ', '');
    } catch (e) {
      return 'Just now';
    }
  };

  return (
    <header className="h-[70px] bg-background/85 backdrop-blur-md px-4 md:px-8 flex items-center justify-between shrink-0 z-40 relative border-b border-border/40">

      {/* Left: Hamburger & Custom Site Selector */}
      <div className="flex items-center gap-4 md:gap-6">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 md:hidden text-foreground hover:bg-muted/80 rounded-full transition-colors focus:outline-none"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {(selectedRole === 'owner' || selectedRole === 'admin') ? (
          <div className="relative" ref={siteRef}>
            <button
              onClick={() => setShowSiteMenu(!showSiteMenu)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-[15px] font-semibold text-foreground hover:bg-muted/80 transition-all duration-200 focus:outline-none select-none",
                showSiteMenu && "bg-muted/85"
              )}
            >
              <Map className="w-4.5 h-4.5 text-foreground shrink-0" />
              <span className="max-w-[120px] sm:max-w-none truncate">
                {sites.find(s => s.id === activeSiteId)?.name || 'Select Site'}
              </span>
              <motion.div
                animate={{ rotate: showSiteMenu ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="shrink-0"
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showSiteMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="absolute left-0 mt-2 w-56 rounded-2xl border border-border/45 bg-card/90 backdrop-blur-md shadow-lg py-2 origin-top-left z-50 p-1.5"
                >
                  <motion.div
                    variants={{
                      visible: { transition: { staggerChildren: 0.05 } }
                    }}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col gap-0.5"
                  >
                    {sites.map(s => {
                      const isSelected = s.id === activeSiteId;
                      return (
                        <motion.button
                          variants={{
                            hidden: { opacity: 0, x: -10 },
                            visible: { opacity: 1, x: 0 }
                          }}
                          key={s.id}
                          onClick={() => {
                            setActiveSite(s.id);
                            setShowSiteMenu(false);
                          }}
                          className={cn(
                            "relative w-full flex items-center justify-between px-3.5 py-2.5 text-[14px] text-left font-medium rounded-xl transition-all duration-200 text-foreground group",
                            isSelected ? "bg-primary/10 text-primary-foreground font-semibold" : "hover:bg-muted/50"
                          )}
                        >
                          <span className="truncate">{s.name}</span>
                          {isSelected && (
                            <motion.div layoutId="selectedSiteTick">
                              <Check className="w-4 h-4 text-foreground" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-2">
            <Map className="w-5 h-5 text-foreground shrink-0" />
            <span className="text-[15px] font-semibold text-foreground truncate">
              {sites.find(s => s.id === activeSiteId)?.name || 'All Sites'}
            </span>
          </div>
        )}
      </div>

      {/* Right: Tools & Utilities */}
      <div className="flex items-center gap-3 sm:gap-4">

        {/* Real-time Status Dot */}
        <div className={cn(
          "hidden sm:flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all duration-300",
          isOnline ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-primary pulse-dot" : "bg-muted-foreground")} />
          {isOnline ? 'Live' : 'Offline'}
        </div>

        {/* Network Icon */}
        <div className="hidden md:block text-foreground/80 hover:text-foreground transition-colors p-1.5">
          <AnimatePresence mode="wait">
            {isOnline ? (
              <motion.div
                key="online"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Wifi className="w-5 h-5 text-foreground" />
              </motion.div>
            ) : (
              <motion.div
                key="offline"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <WifiOff className="w-5 h-5 text-muted-foreground animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Language Selection */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            aria-label="Select language"
            className={cn(
              "px-3 py-2 text-[14px] font-semibold text-foreground flex items-center gap-2 rounded-xl transition-all duration-200 hover:bg-muted/80 focus:outline-none",
              showLangMenu && "bg-muted/80"
            )}
          >
            <Globe className="w-5 h-5 text-foreground" />
            <span className="hidden sm:inline">
              {languages.find(l => l.code === currentLanguage)?.name || 'EN'}
            </span>
            <span className="sm:hidden uppercase text-[12px] tracking-wide">
              {currentLanguage}
            </span>
          </button>

          <AnimatePresence>
            {showLangMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="absolute right-0 mt-2 w-44 rounded-2xl border border-border/45 bg-card/90 backdrop-blur-md shadow-lg py-2 origin-top-right z-50 p-1.5"
              >
                <motion.div
                  variants={{
                    visible: { transition: { staggerChildren: 0.05 } }
                  }}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-0.5"
                >
                  {languages.map(lang => {
                    const isSelected = currentLanguage === lang.code;
                    return (
                      <motion.button
                        variants={{
                          hidden: { opacity: 0, x: 10 },
                          visible: { opacity: 1, x: 0 }
                        }}
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as any);
                          setShowLangMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3.5 py-2.5 text-[14px] text-left font-medium rounded-xl transition-all duration-200 text-foreground group",
                          isSelected ? "bg-primary/10 text-primary-foreground font-semibold" : "hover:bg-muted/50"
                        )}
                      >
                        <span>{lang.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-foreground" />}
                      </motion.button>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Sun/Moon Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 text-foreground hover:bg-muted/80 rounded-xl transition-all duration-200 relative focus:outline-none"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.div
                key="moon"
                initial={{ rotate: -90, scale: 0, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="w-5 h-5 text-primary" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ rotate: 90, scale: 0, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: -90, scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="w-5 h-5 text-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            className={cn(
              "p-2.5 text-foreground bg-background/40 backdrop-blur-md border border-border/40 rounded-2xl relative transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:bg-background/60 shadow-sm",
              showNotifications && "bg-muted/80 border-primary/30"
            )}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <motion.span
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                }}
                className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow"
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -12, filter: "blur(6px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.96, y: -8, filter: "blur(6px)" }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-[480px] max-w-[95vw] rounded-3xl border border-border/50 bg-card/85 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,.18)] p-0 z-50 origin-top-right overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl text-primary flex items-center justify-center shrink-0">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[16px] font-semibold text-foreground leading-none">Notifications</span>
                      <span className="text-[12px] text-muted-foreground mt-1">{unreadCount} unread notifications</span>
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => clearNotifications()}
                      className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground bg-transparent hover:bg-muted/80 border border-transparent rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Body */}
                <div className="max-h-[420px] overflow-y-auto custom-scrollbar p-[16px] flex flex-col gap-[12px]">
                  {notifications.length === 0 ? (
                    <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                      <div className="p-4 bg-muted/40 rounded-full text-muted-foreground flex items-center justify-center shrink-0">
                        <Bell className="w-8 h-8" />
                      </div>
                      <h4 className="text-[16px] font-semibold text-foreground">You're all caught up</h4>
                      <p className="text-[14px] text-muted-foreground">No notifications right now.</p>
                    </div>
                  ) : (
                    <motion.div
                      variants={{
                        visible: { transition: { staggerChildren: 0.05 } }
                      }}
                      initial="hidden"
                      animate="visible"
                      className="flex flex-col gap-[12px]"
                    >
                      {notifications.map((notif) => {
                        const notifType: string = notif.type;
                        const iconBgClass = cn(
                          "w-[44px] h-[44px] rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200",
                          notifType === 'success' && "bg-emerald-500/10 text-emerald-500",
                          notifType === 'error' && "bg-red-500/10 text-red-500",
                          notifType === 'warning' && "bg-amber-500/10 text-amber-500",
                          notifType === 'info' && "bg-blue-500/10 text-blue-500",
                          notifType === 'payment' && "bg-emerald-500/10 text-emerald-500",
                          notifType === 'invoice' && "bg-purple-500/10 text-purple-500",
                          notifType === 'customer' && "bg-cyan-500/10 text-cyan-500",
                          !['success', 'error', 'warning', 'info', 'payment', 'invoice', 'customer'].includes(notifType) && "bg-muted/10 text-muted-foreground"
                        );

                        return (
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, y: 12, scale: 0.98 },
                              visible: { opacity: 1, y: 0, scale: 1 }
                            }}
                            key={notif.id}
                            className={cn(
                              "group relative flex items-start gap-3.5 p-[16px] rounded-2xl border border-border/40 bg-card hover:bg-muted/40 hover:border-border/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                              !notif.read && "border-primary/20 bg-primary/[0.02]"
                            )}
                          >
                            {/* UNREAD Left accent bar (animated and rounded) */}
                            {!notif.read && (
                              <motion.div
                                layoutId={`accent-${notif.id}`}
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-primary origin-center"
                              />
                            )}

                            {/* Icon Container */}
                            <div className={iconBgClass}>
                              {getNotificationIcon(notif.type)}
                            </div>

                            {/* Title, message, time */}
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-[16px] font-semibold text-foreground leading-[1.3] truncate">
                                  {notif.title}
                                </h4>
                                {/* Small unread badge on right */}
                                {!notif.read && (
                                  <span className="shrink-0 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                    Unread
                                  </span>
                                )}
                              </div>
                              <p className="text-[14px] text-muted-foreground mt-1 leading-[1.4] line-clamp-2 break-words">
                                {notif.message}
                              </p>
                              <p className="text-[12px] text-muted-foreground/60 mt-1.5 font-medium">
                                {getRelativeTime(notif.createdAt)}
                              </p>
                            </div>

                            {/* Arrow Icon */}
                            <div className="self-center shrink-0 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200">
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 p-4 border-t border-border/50 bg-card/95 backdrop-blur-sm">
                  <button className="group w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/80 text-foreground transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                    View all notifications
                    <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
};
