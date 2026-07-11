import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../utils/i18n';
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

  // Role based navigation config
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
    <aside 
      className={`h-screen border-r border-construction-200 dark:border-construction-800 bg-white/80 dark:bg-construction-900/80 backdrop-blur-md flex flex-col justify-between transition-all duration-300 relative ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-construction-200 dark:border-construction-800">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-safety-500 text-construction-950 flex items-center justify-center font-bold shrink-0 shadow-md">
              <HardHat className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <span className="font-extrabold text-lg bg-gradient-to-r from-construction-900 to-construction-600 dark:from-white dark:to-construction-400 bg-clip-text text-transparent truncate">
                MusterMate
              </span>
            )}
          </div>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-construction-700 dark:bg-construction-800 text-white flex items-center justify-center border border-construction-600 shadow-md hover:bg-safety-500 hover:text-construction-950 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="mt-6 px-3 flex flex-col gap-1.5">
          {navItems.map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-safety-500 text-construction-950 shadow-md' 
                    : 'text-construction-600 dark:text-construction-400 hover:bg-construction-100 dark:hover:bg-construction-800/50 hover:text-construction-900 dark:hover:text-white'
                }`}
              >
                {item.icon}
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Session User Profile & Logout */}
      <div className="p-4 border-t border-construction-200 dark:border-construction-800 bg-construction-50/50 dark:bg-construction-950/20 space-y-3">
        {currentUser && !isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-safety-500 text-construction-950 flex items-center justify-center font-extrabold text-xs uppercase shrink-0">
              {currentUser.name.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-construction-850 dark:text-white truncate leading-normal">{currentUser.name}</p>
              <p className="text-[9px] text-construction-450 uppercase tracking-widest font-extrabold truncate">{currentUser.role}</p>
            </div>
          </div>
        )}
        
        <button
          onClick={() => logoutUser()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 dark:border-red-950/30 hover:bg-red-500/10 text-xs font-bold text-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>Logout Session</span>}
        </button>
      </div>
    </aside>
  );
};
