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
          success: <CheckCircle2 className="w-5 h-5 text-foreground shrink-0" />,
          error: <XCircle className="w-5 h-5 text-foreground shrink-0" />,
          warning: <AlertCircle className="w-5 h-5 text-foreground shrink-0" />,
          info: <Info className="w-5 h-5 text-foreground shrink-0" />,
        };

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-4 p-5 rounded-[28px] border border-border bg-card transition-all duration-300 transform translate-y-0 animate-fade-in shadow-none"
          >
            {iconMap[toast.type]}
            <div className="flex-1 text-[14px] font-medium text-foreground leading-tight">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
