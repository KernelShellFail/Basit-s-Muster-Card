import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from './Toast';

interface LayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  children: ReactNode;
}

export const Layout = ({ currentTab, setCurrentTab, children }: LayoutProps) => {
  return (
    <div className="flex h-screen w-screen bg-construction-50 dark:bg-construction-950 overflow-hidden font-sans">
      {/* Dynamic Navigation Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Utilities */}
        <Header />

        {/* Scrollable Page Screen */}
        <main className="flex-1 overflow-y-auto p-6 focus:outline-none relative">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Global Action Toasts */}
      <ToastContainer />
    </div>
  );
};
