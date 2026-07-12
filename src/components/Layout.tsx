import { ReactNode, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from './Toast';

interface LayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  children: ReactNode;
}

export const Layout = ({ currentTab, setCurrentTab, children }: LayoutProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
      wrapper: scrollRef.current || window,
      content: scrollRef.current?.firstElementChild as HTMLElement || document.body,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden font-sans selection:bg-brand-500 selection:text-black">
      {/* Dynamic Navigation Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Decorative Background Blob */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 dark:bg-brand-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header Utilities */}
        <Header />

        {/* Scrollable Page Screen */}
        <main 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 focus:outline-none relative z-10 custom-scrollbar"
        >
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
