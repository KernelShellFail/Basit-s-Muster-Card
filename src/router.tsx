import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { Layout } from './components/Layout';

// Lazy loaded components
const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then(module => ({ default: module.Dashboard })));
const Workers = lazy(() => import('./features/workers/Workers').then(module => ({ default: module.Workers })));
const Attendance = lazy(() => import('./features/attendance/Attendance').then(module => ({ default: module.Attendance })));
const Payments = lazy(() => import('./features/payments/Payments').then(module => ({ default: module.Payments })));
const Leaves = lazy(() => import('./features/leave/Leaves').then(module => ({ default: module.Leaves })));
const Sites = lazy(() => import('./features/sites/Sites').then(module => ({ default: module.Sites })));
const Chat = lazy(() => import('./features/chat/Chat').then(module => ({ default: module.Chat })));
const Settings = lazy(() => import('./features/settings/Settings').then(module => ({ default: module.Settings })));
const Staff = lazy(() => import('./features/staff/Staff').then(module => ({ default: module.Staff })));
const AuthPage = lazy(() => import('./features/auth/AuthPage').then(module => ({ default: module.AuthPage })));
const LabourDashboard = lazy(() => import('./features/labour/LabourDashboard').then(module => ({ default: module.LabourDashboard })));
const CrossCheck = lazy(() => import('./features/verification/CrossCheck').then(module => ({ default: module.CrossCheck })));

const SuspenseLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-[3px] border-muted border-t-foreground rounded-full animate-spin" />
  </div>
);

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<SuspenseLoader />}>
    {children}
  </Suspense>
);

const AuthGuard = () => {
  const { currentUser } = useAppStore();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <Layout>
      <Suspense fallback={<SuspenseLoader />}>
        <Outlet />
      </Suspense>
    </Layout>
  );
};

const RoleBasedDashboard = () => {
  const { selectedRole } = useAppStore();
  return selectedRole === 'labour' ? <LabourDashboard /> : <Dashboard />;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <SuspenseWrapper><AuthPage /></SuspenseWrapper>,
  },
  {
    path: '/',
    element: <AuthGuard />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <RoleBasedDashboard /> },
      { path: 'verification', element: <CrossCheck /> },
      { path: 'workers', element: <Workers /> },
      { path: 'attendance', element: <Attendance /> },
      { path: 'payments', element: <Payments /> },
      { path: 'leaves', element: <Leaves /> },
      { path: 'sites', element: <Sites /> },
      { path: 'staff', element: <Staff /> },
      { path: 'chat', element: <Chat /> },
      { path: 'settings', element: <Settings /> },
      { path: '*', element: <Navigate to="/dashboard" replace /> }
    ],
  },
]);
