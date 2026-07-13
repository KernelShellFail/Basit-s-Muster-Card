import { useState } from 'react';
import { motion } from 'framer-motion';
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
  ChevronRight,
  HardHat,
  UserSquare2,
  ShieldCheck,
  LogOut
} from 'lucide-react';

export const Sidebar = () => {
  const { selectedRole, currentLanguage, currentUser, logoutUser } = useAppStore();
  const { t } = useTranslation(currentLanguage);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = location.pathname.split('/')[1] || 'dashboard';

  const getNavItems = () => {
    switch (selectedRole) {
      case 'owner':
        return [
          { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'verification', label: 'Verification Check', icon: <ShieldCheck className="w-5 h-5" /> },
          { id: 'workers', label: t('workers'), icon: <Users className="w-5 h-5" /> },
          { id: 'sites', label: t('sites'), icon: <MapPin className="w-5 h-5" /> },
          { id: 'staff', label: 'Staff Directory', icon: <UserSquare2 className="w-5 h-5" /> },
          { id: 'payments', label: t('payments'), icon: <IndianRupee className="w-5 h-5" /> },
          { id: 'leaves', label: t('leaves'), icon: <CalendarDays className="w-5 h-5" /> },
          { id: 'chat', label: t('chat'), icon: <MessageSquare className="w-5 h-5" /> },
          { id: 'settings', label: t('settings'), icon: <Settings className="w-5 h-5" /> },
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'verification', label: 'Verification Check', icon: <ShieldCheck className="w-5 h-5" /> },
          { id: 'workers', label: t('workers'), icon: <Users className="w-5 h-5" /> },
          { id: 'staff', label: 'Staff Directory', icon: <UserSquare2 className="w-5 h-5" /> },
          { id: 'attendance', label: t('attendance'), icon: <CheckSquare className="w-5 h-5" /> },
          { id: 'payments', label: t('payments'), icon: <IndianRupee className="w-5 h-5" /> },
          { id: 'leaves', label: t('leaves'), icon: <CalendarDays className="w-5 h-5" /> },
          { id: 'chat', label: t('chat'), icon: <MessageSquare className="w-5 h-5" /> },
          { id: 'settings', label: t('settings'), icon: <Settings className="w-5 h-5" /> },
        ];
      case 'supervisor':
        return [
          { id: 'attendance', label: t('attendance'), icon: <CheckSquare className="w-5 h-5" /> },
          { id: 'workers', label: t('workers'), icon: <Users className="w-5 h-5" /> },
          { id: 'chat', label: t('chat'), icon: <MessageSquare className="w-5 h-5" /> },
        ];
      case 'labour':
        return [
          { id: 'dashboard', label: 'My Wage Roster', icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'chat', label: t('chat'), icon: <MessageSquare className="w-5 h-5" /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <motion.aside 
      layout
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className="h-screen border-r border-border bg-background flex flex-col justify-between relative z-20 shrink-0"
    >
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Brand header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-border shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
              <HardHat className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-medium text-[22px] tracking-[-0.03em] truncate text-foreground"
              >
                MusterMate
              </motion.span>
            )}
          </div>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-4 top-6 w-8 h-8 rounded-full bg-background text-foreground flex items-center justify-center border border-border hover:bg-muted transition-colors z-50"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
          <nav className="flex flex-col gap-1.5">
            {navItems.map(item => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/${item.id}`)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    "relative w-full flex items-center gap-3 px-4 py-3 rounded-full text-[14px] font-medium transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="relative z-10 truncate">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Session User Profile & Logout */}
      <div className="p-6 border-t border-border bg-background shrink-0">
        {currentUser && !isCollapsed && (
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium text-[16px] uppercase shrink-0">
              {currentUser.name.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium truncate leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium truncate mt-0.5">
                {currentUser.role}
              </p>
            </div>
          </div>
        )}
        
        <button
          onClick={() => logoutUser()}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 rounded-[28px] text-[14px] font-medium transition-colors border",
            "border-foreground text-foreground hover:bg-foreground hover:text-background"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
};
