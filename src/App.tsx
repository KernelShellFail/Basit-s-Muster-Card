import { useState, useEffect } from 'react';
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

function App() {
  const { initApp, selectedRole, currentUser } = useAppStore();
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Initialize LocalDB seeding and configuration states
  useEffect(() => {
    initApp();
  }, [initApp]);

  // If user is not logged in, force authentication portal
  if (!currentUser) {
    return <AuthPage />;
  }

  // Handle Tab views routing
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return selectedRole === 'labour' 
          ? <LabourDashboard /> 
          : <Dashboard setCurrentTab={setCurrentTab} />;
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
        return selectedRole === 'labour' 
          ? <LabourDashboard /> 
          : <Dashboard setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {renderTabContent()}
    </Layout>
  );
}

export default App;
