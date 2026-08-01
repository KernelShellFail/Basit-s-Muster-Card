import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../utils/cn';
import {
  Bell,
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
import { useSites, useNotifications, useClearNotifications, useMarkNotificationRead } from '../api/queries';
import { SystemNotification } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const {
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
  const { mutate: markNotificationRead } = useMarkNotificationRead();
  const navigate = useNavigate();

  const handleNotificationClick = (notif: SystemNotification) => {
    if (!notif.read) {
      markNotificationRead(notif.id);
    }
    setShowNotifications(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showSiteMenu, setShowSiteMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const notifRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const siteRef = useRef<HTMLDivElement>(null);

  // Auto-select the first site for users without an explicit site assignment,
  // so no hardcoded default site id is ever needed.
  useEffect(() => {
    if (!activeSiteId && sites.length > 0) {
      setActiveSite(sites[0].id);
    }
  }, [activeSiteId, sites, setActiveSite]);

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
        return <CheckCircle2 className="w-5 h-5 text-fn-success" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-fn-warning" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-fn-error" />;
      default:
        return <Info className="w-5 h-5 text-fn-info" />;
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
    <header className="h-[70px] bg-just-black/85 backdrop-blur-md px-4 md:px-8 flex items-center justify-between shrink-0 z-40 relative border-b border-border">

      {/* Left: Hamburger & Custom Site Selector */}
      <div className="flex items-center gap-4 md:gap-6">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 md:hidden text-surface-cream hover:bg-muted/80 rounded-full transition-colors focus:outline-none"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {(selectedRole === 'owner' || selectedRole === 'admin') ? (
          <div className="relative" ref={siteRef}>
            <button
              onClick={() => setShowSiteMenu(!showSiteMenu)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-full text-[15px] font-medium text-surface-cream hover:text-surface-50 transition-all duration-200 focus:outline-none select-none",
                showSiteMenu && "text-surface-50"
              )}
            >
              <Map className="w-4.5 h-4.5 text-surface-cream shrink-0" />
              <span className="max-w-[120px] sm:max-w-none truncate">
                {sites.find(s => s.id === activeSiteId)?.name || 'Select Site'}
              </span>
              <motion.div
                animate={{ rotate: showSiteMenu ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="shrink-0"
              >
                <ChevronDown className="w-4 h-4 text-surface-50" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showSiteMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="absolute left-0 mt-2 w-56 rounded-[8px] border border-border bg-off-black py-2 origin-top-left z-50 p-1.5"
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
                            "relative w-full flex items-center justify-between px-3.5 py-2.5 text-[14px] text-left font-medium rounded-[8px] transition-all duration-200 text-surface-cream group",
                            isSelected ? "bg-primary/10 text-shockingly-green font-semibold" : "hover:bg-muted/50"
                          )}
                        >
                          <span className="truncate">{s.name}</span>
                          {isSelected && (
                            <motion.div layoutId="selectedSiteTick">
                              <Check className="w-4 h-4 text-shockingly-green" />
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
            <Map className="w-5 h-5 text-surface-cream shrink-0" />
            <span className="text-[15px] font-medium text-surface-cream truncate">
              {sites.find(s => s.id === activeSiteId)?.name || 'All Sites'}
            </span>
          </div>
        )}
      </div>

      {/* Right: Tools & Utilities */}
      <div className="flex items-center gap-3 sm:gap-4">

        {/* Real-time Status Dot */}
        <div className={cn(
          "hidden sm:flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider rounded-full transition-all duration-300",
          isOnline ? "text-shockingly-green" : "text-surface-50"
        )}>
          <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-shockingly-green pulse-dot" : "bg-surface-50")} />
          {isOnline ? 'Live' : 'Offline'}
        </div>

        {/* Network Icon */}
        <div className="hidden md:block text-surface-cream/80 hover:text-surface-cream transition-colors p-1.5">
          <AnimatePresence mode="wait">
            {isOnline ? (
              <motion.div
                key="online"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Wifi className="w-5 h-5 text-surface-cream" />
              </motion.div>
            ) : (
              <motion.div
                key="offline"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <WifiOff className="w-5 h-5 text-surface-50 animate-pulse" />
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
              "px-3 py-2 text-[14px] font-medium text-surface-cream flex items-center gap-2 rounded-full transition-all duration-200 hover:text-surface-50 focus:outline-none",
              showLangMenu && "text-surface-50"
            )}
          >
            <Globe className="w-5 h-5 text-surface-cream" />
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
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="absolute right-0 mt-2 w-44 rounded-[8px] border border-border bg-off-black py-2 origin-top-right z-50 p-1.5"
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
                          "w-full flex items-center justify-between px-3.5 py-2.5 text-[14px] text-left font-medium rounded-[8px] transition-all duration-200 text-surface-cream group",
                          isSelected ? "bg-primary/10 text-shockingly-green font-semibold" : "hover:bg-muted/50"
                        )}
                      >
                        <span>{lang.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-shockingly-green" />}
                      </motion.button>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            className={cn(
              "p-2.5 text-surface-cream border border-border rounded-full relative transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:text-surface-50",
              showNotifications && "text-shockingly-green border-primary/40"
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
                className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-shockingly-green px-1 text-[10px] font-bold text-just-black"
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -6 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-[480px] max-w-[95vw] rounded-[8px] border border-border bg-off-black p-0 z-50 origin-top-right overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-[8px] text-shockingly-green flex items-center justify-center shrink-0">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[16px] font-semibold text-surface-cream leading-none">Notifications</span>
                      <span className="text-[12px] text-surface-50 mt-1">{unreadCount} unread notifications</span>
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => clearNotifications()}
                      className="px-3 py-1.5 text-xs font-semibold text-surface-50 hover:text-surface-cream bg-transparent hover:bg-muted border border-transparent rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Body */}
                <div data-lenis-prevent className="max-h-[420px] overflow-y-auto overscroll-contain custom-scrollbar p-4 flex flex-col gap-3">
                  {notifications.length === 0 ? (
                    <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                      <div className="p-4 bg-muted/40 rounded-full text-surface-50 flex items-center justify-center shrink-0">
                        <Bell className="w-8 h-8" />
                      </div>
                      <h4 className="text-[16px] font-semibold text-surface-cream">You're all caught up</h4>
                      <p className="text-[14px] text-surface-50">No notifications right now.</p>
                    </div>
                  ) : (
                    <motion.div
                      variants={{
                        visible: { transition: { staggerChildren: 0.05 } }
                      }}
                      initial="hidden"
                      animate="visible"
                      className="flex flex-col gap-3"
                    >
                      {notifications.map((notif) => {
                        const notifType: string = notif.type;
                        const iconBgClass = cn(
                          "w-[44px] h-[44px] rounded-[8px] flex items-center justify-center shrink-0 transition-colors duration-200",
                          notifType === 'success' && "bg-fn-success/10 text-fn-success",
                          notifType === 'error' && "bg-fn-error/10 text-fn-error",
                          notifType === 'warning' && "bg-fn-warning/10 text-fn-warning",
                          notifType === 'info' && "bg-fn-info/10 text-fn-info",
                          notifType === 'payment' && "bg-fn-success/10 text-fn-success",
                          notifType === 'invoice' && "bg-lilac/10 text-lilac",
                          notifType === 'customer' && "bg-blue/10 text-blue",
                          !['success', 'error', 'warning', 'info', 'payment', 'invoice', 'customer'].includes(notifType) && "bg-muted/10 text-surface-50"
                        );

                        return (
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, y: 8, scale: 0.99 },
                              visible: { opacity: 1, y: 0, scale: 1 }
                            }}
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={cn(
                              "group relative flex items-start gap-3.5 p-4 rounded-[8px] border border-border bg-card hover:bg-muted transition-all duration-300 cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                              !notif.read && "border-primary/20"
                            )}
                          >
                            {/* UNREAD Left accent bar */}
                            {!notif.read && (
                              <motion.div
                                layoutId={`accent-${notif.id}`}
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-shockingly-green origin-center"
                              />
                            )}

                            {/* Icon Container */}
                            <div className={iconBgClass}>
                              {getNotificationIcon(notif.type)}
                            </div>

                            {/* Title, message, time */}
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-[16px] font-semibold text-surface-cream leading-[1.3] truncate">
                                  {notif.title}
                                </h4>
                                {!notif.read && (
                                  <span className="shrink-0 text-[10px] bg-primary/10 text-shockingly-green px-2 py-0.5 rounded-full font-bold">
                                    Unread
                                  </span>
                                )}
                              </div>
                              <p className="text-[14px] text-surface-50 mt-1 leading-[1.4] line-clamp-2 break-words">
                                {notif.message}
                              </p>
                              <p className="text-[12px] text-surface-50/60 mt-1.5 font-medium">
                                {getRelativeTime(notif.createdAt)}
                              </p>
                            </div>

                            {/* Arrow Icon */}
                            <div className="self-center shrink-0 text-surface-50/40 group-hover:text-surface-cream group-hover:translate-x-0.5 transition-all duration-200">
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 p-4 border-t border-border bg-off-black">
                  <button
                    onClick={() => { setShowNotifications(false); navigate('/notifications'); }}
                    className="group w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full text-sm font-semibold btn-ghost-pill transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
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
