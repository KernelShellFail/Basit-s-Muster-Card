import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../utils/i18n';
import { cn } from '../utils/cn';
import {
  LayoutDashboard,
  Users,
  MapPin,
  CheckSquare,
  IndianRupee,
  CalendarDays,
  MessageSquare,
  Settings,
  ChevronLeft,
  HardHat,
  UserSquare2,
  ShieldCheck,
  LogOut,
  X
} from 'lucide-react';

// Discipline color taxonomy — each module wears its category hue.
const MODULE_TEXT: Record<string, string> = {
  dashboard: 'text-shockingly-green',
  verification: 'text-shockingly-green',
  workers: 'text-orangey',
  attendance: 'text-pink',
  payments: 'text-lilac',
  leaves: 'text-lilac',
  sites: 'text-blue',
  staff: 'text-blue',
  chat: 'text-blue',
  settings: 'text-blue',
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      type: 'spring' as const,
      stiffness: 300,
      damping: 24
    }
  })
};

export const Sidebar = () => {
  const { selectedRole, currentLanguage, currentUser, logoutUser, isMobileMenuOpen, setMobileMenuOpen } = useAppStore();
  const { t } = useTranslation(currentLanguage);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentTab = location.pathname.split('/')[1] || 'dashboard';

  const getNavItems = () => {
    switch (selectedRole) {
      case 'owner':
        return [
          { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard className="w-[22px] h-[22px]" /> },
          { id: 'verification', label: 'Verification Check', icon: <ShieldCheck className="w-[22px] h-[22px]" /> },
          { id: 'workers', label: t('workers'), icon: <Users className="w-[22px] h-[22px]" /> },
          { id: 'sites', label: t('sites'), icon: <MapPin className="w-[22px] h-[22px]" /> },
          { id: 'staff', label: 'Staff Directory', icon: <UserSquare2 className="w-[22px] h-[22px]" /> },
          { id: 'payments', label: t('payments'), icon: <IndianRupee className="w-[22px] h-[22px]" /> },
          { id: 'leaves', label: t('leaves'), icon: <CalendarDays className="w-[22px] h-[22px]" /> },
          { id: 'chat', label: t('chat'), icon: <MessageSquare className="w-[22px] h-[22px]" /> },
          { id: 'settings', label: t('settings'), icon: <Settings className="w-[22px] h-[22px]" /> },
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard className="w-[22px] h-[22px]" /> },
          { id: 'verification', label: 'Verification Check', icon: <ShieldCheck className="w-[22px] h-[22px]" /> },
          { id: 'workers', label: t('workers'), icon: <Users className="w-[22px] h-[22px]" /> },
          { id: 'staff', label: 'Staff Directory', icon: <UserSquare2 className="w-[22px] h-[22px]" /> },
          { id: 'attendance', label: t('attendance'), icon: <CheckSquare className="w-[22px] h-[22px]" /> },
          { id: 'payments', label: t('payments'), icon: <IndianRupee className="w-[22px] h-[22px]" /> },
          { id: 'leaves', label: t('leaves'), icon: <CalendarDays className="w-[22px] h-[22px]" /> },
          { id: 'chat', label: t('chat'), icon: <MessageSquare className="w-[22px] h-[22px]" /> },
          { id: 'settings', label: t('settings'), icon: <Settings className="w-[22px] h-[22px]" /> },
        ];
      case 'supervisor':
        return [
          { id: 'attendance', label: t('attendance'), icon: <CheckSquare className="w-[22px] h-[22px]" /> },
          { id: 'workers', label: t('workers'), icon: <Users className="w-[22px] h-[22px]" /> },
          { id: 'chat', label: t('chat'), icon: <MessageSquare className="w-[22px] h-[22px]" /> },
        ];
      case 'labour':
        return [
          { id: 'dashboard', label: 'My Wage Roster', icon: <LayoutDashboard className="w-[22px] h-[22px]" /> },
          { id: 'chat', label: t('chat'), icon: <MessageSquare className="w-[22px] h-[22px]" /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const handleNavigation = (id: string) => {
    navigate(`/${id}`);
    if (window.innerWidth < 768) {
      setMobileMenuOpen(false);
    }
  };

  // On mobile we don't want the sidebar to be collapsed.
  const isEffectivelyCollapsed = isCollapsed && window.innerWidth >= 768;

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        layout
        initial={false}
        animate={{
          width: isEffectivelyCollapsed ? 84 : 264
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 h-dvh md:h-screen bg-background/95 glass-panel border-r border-border flex flex-col justify-between md:relative transition-transform duration-300",
          isMobileMenuOpen ? "translate-x-0 w-[280px]" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex-1 flex flex-col">
          {/* Brand header */}
          <div className={cn(
            "h-[50px] flex items-center shrink-0 border-b border-transparent relative",
            isEffectivelyCollapsed ? "justify-center px-0" : "justify-between px-6"
          )}>
            <div className="flex items-center gap-3 overflow-hidden">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full border border-surface-cream text-surface-cream flex items-center justify-center shrink-0"
              >
                <HardHat className="w-5 h-5" />
              </motion.div>

              <AnimatePresence initial={false}>
                {!isEffectivelyCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="font-semibold text-[22px] tracking-[-0.03em] truncate text-surface-cream whitespace-nowrap origin-left leading-none"
                  >
                    Muster<span className="text-shockingly-green">Mate</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop Collapse Toggle — borderless round icon button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card border border-border text-surface-cream hover:text-shockingly-green items-center justify-center transition-colors z-50 shadow-lg"
            >
              <motion.div
                initial={false}
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.div>
            </motion.button>

            {/* Mobile Close Button */}
            <button
              className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation list */}
          <div className="flex-1 overflow-y-auto p-[10px] m-[10px] custom-scrollbar">
            <nav className="flex flex-col gap-1.5">
              <AnimatePresence>
                {isMounted && navItems.map((item, i) => {
                  const isActive = currentTab === item.id;
                  const activeColor = MODULE_TEXT[item.id] || 'text-shockingly-green';
                  return (
                    <motion.button
                      custom={i}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      key={item.id}
                      onClick={() => handleNavigation(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        "relative w-full flex items-center h-[48px] rounded-full text-[15px] transition-colors group",
                        isEffectivelyCollapsed ? "justify-center px-0" : "px-4 gap-3",
                        isActive ? "font-semibold" : "text-surface-50 hover:text-surface-cream"
                      )}
                    >
                      {/* Active underline hairline in the module color */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className={cn("absolute bottom-0 left-4 right-4 h-px bg-current", activeColor)}
                          transition={{ type: "spring", stiffness: 300, damping: 24 }}
                        />
                      )}

                      <motion.span
                        className={cn("relative z-10 flex items-center justify-center", isActive && activeColor)}
                        whileHover={!isActive ? { scale: 1.1 } : {}}
                        whileTap={{ scale: 0.95 }}
                      >
                        {item.icon}
                      </motion.span>

                      <AnimatePresence initial={false}>
                        {!isEffectivelyCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className={cn(
                              "relative z-10 whitespace-nowrap overflow-hidden text-left",
                              isActive && activeColor
                            )}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Tooltip for collapsed state */}
                      {isEffectivelyCollapsed && (
                        <div className="absolute left-full ml-4 px-3 py-1.5 bg-off-black text-surface-cream text-sm rounded-[8px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-border">
                          {item.label}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </nav>
          </div>
        </div>

        {/* Session User Profile & Logout */}
        <div className="p-4 border-t border-border bg-background/50 shrink-0">
          <AnimatePresence>
            {currentUser && !isEffectivelyCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 mb-4 px-2 overflow-hidden"
              >
                {currentUser.photo ? (
                  <img src={currentUser.photo} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover border border-border shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full border border-border text-surface-cream flex items-center justify-center font-medium text-[16px] uppercase shrink-0">
                    {currentUser.name.slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold truncate leading-tight text-surface-cream">{currentUser.name}</p>
                  <p className="text-[11px] text-surface-50 uppercase tracking-wider font-medium truncate mt-0.5">
                    {currentUser.role}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => logoutUser()}
            className={cn(
              "w-full flex items-center justify-center h-[48px] rounded-full text-[14px] font-semibold transition-all duration-200 border border-surface-cream text-surface-cream hover:text-fn-error hover:border-fn-error",
              isEffectivelyCollapsed ? "px-0" : "px-4 gap-2"
            )}
          >
            <motion.div whileHover={{ rotate: -10 }}>
              <LogOut className="w-5 h-5" />
            </motion.div>

            <AnimatePresence initial={false}>
              {!isEffectivelyCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
};
