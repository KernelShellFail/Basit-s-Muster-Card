import { useState } from 'react';
import { motion } from 'framer-motion';
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

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar = ({ currentTab, setCurrentTab }: SidebarProps) => {
  const { selectedRole, currentLanguage, currentUser, logoutUser } = useAppStore();
  const { t } = useTranslation(currentLanguage);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      className="h-screen border-r border-border bg-card/80 backdrop-blur-xl flex flex-col justify-between relative z-20 shrink-0"
    >
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-black flex items-center justify-center font-bold shrink-0 shadow-glow">
              <HardHat className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-extrabold text-lg tracking-tight truncate"
              >
                MusterMate
              </motion.span>
            )}
          </div>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3.5 top-5 w-7 h-7 rounded-full bg-card text-foreground flex items-center justify-center border shadow-sm hover:bg-accent transition-colors z-50"
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
                  onClick={() => setCurrentTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary rounded-xl"
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
      <div className="p-4 border-t border-border bg-muted/30 shrink-0">
        {currentUser && !isCollapsed && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-brand-500 text-black flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {currentUser.name.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold truncate">
                {currentUser.role}
              </p>
            </div>
          </div>
        )}
        
        <button
          onClick={() => logoutUser()}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors border",
            "border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
};
