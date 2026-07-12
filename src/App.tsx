import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import { Layout } from './components/Layout';
import { Dashboard } from './features/dashboard/Dashboard';
import { Workers } from './features/workers/Workers';
import { Attendance } from './features/attendance/Attendance';
import { Payments } from './features/payments/Payments';
import { Leaves } from './features/leave/Leaves';
import { Sites } from './features/sites/Sites';
import { Chat } from './features/chat/Chat';
import { Settings } from './features/settings/Settings';
import { Staff } from './features/staff/Staff';
import { AuthPage } from './features/auth/AuthPage';
import { LabourDashboard } from './features/labour/LabourDashboard';
import { CrossCheck } from './features/verification/CrossCheck';
import { pageTransition } from './utils/animations';

function App() {
  const { initApp, selectedRole, currentUser } = useAppStore();
  const [currentTab, setCurrentTab] = useState('dashboard');

  useEffect(() => {
    initApp();
  }, [initApp]);

  if (!currentUser) {
    return <AuthPage />;
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return selectedRole === 'labour' ? <LabourDashboard /> : <Dashboard setCurrentTab={setCurrentTab} />;
      case 'verification':
        return <CrossCheck />;
      case 'workers':
        return <Workers />;
      case 'attendance':
        return <Attendance />;
      case 'payments':
        return <Payments />;
      case 'leaves':
        return <Leaves />;
      case 'sites':
        return <Sites />;
      case 'staff':
        return <Staff />;
      case 'chat':
        return <Chat />;
      case 'settings':
        return <Settings />;
      default:
        return selectedRole === 'labour' ? <LabourDashboard /> : <Dashboard setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTab}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={pageTransition}
          className="h-full w-full"
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}

export default App;
