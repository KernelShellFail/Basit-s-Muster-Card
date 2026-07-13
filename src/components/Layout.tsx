import { ReactNode, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from './Toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { pageTransition } from '../utils/animations';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

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
      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-background focus:text-foreground focus:font-bold">
        Skip to main content
      </a>

      {/* Dynamic Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-background">
        {/* Top Header Utilities */}
        <Header />

        {/* Scrollable Page Screen */}
        <main 
          id="main-content"
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 focus:outline-none relative z-10 custom-scrollbar"
        >
          <div className="mx-auto max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={pageTransition}
                className="h-full w-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Global Action Toasts */}
      <ToastContainer />
    </div>
  );
};
