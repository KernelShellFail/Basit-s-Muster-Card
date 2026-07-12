import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
  const event = new CustomEvent('mm-toast', { detail: { message, type } });
  window.dispatchEvent(event);
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type: ToastMessage['type'] }>;
      const { message, type } = customEvent.detail;
      const id = `${Date.now()}-${Math.random()}`;
      
      setToasts(prev => [...prev, { id, message, type }]);

      // Auto-remove after 4 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };

    window.addEventListener('mm-toast', handleToastEvent);
    return () => window.removeEventListener('mm-toast', handleToastEvent);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map(toast => {
        const iconMap = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          error: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
          warning: <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />,
          info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
        };

        const bgMap = {
          success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-500/20',
          error: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-500/20',
          warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-500/20',
          info: 'bg-sky-50 border-sky-200 dark:bg-sky-950/20 dark:border-sky-500/20',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border glass-panel shadow-lg transition-all duration-300 transform translate-y-0 animate-fade-in ${bgMap[toast.type]}`}
          >
            {iconMap[toast.type]}
            <div className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
