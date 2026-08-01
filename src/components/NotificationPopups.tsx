import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle2, AlertTriangle, XCircle, Info, CreditCard, FileText, User } from 'lucide-react';
import { useNotifications, useMarkNotificationRead } from '../api/queries';
import { SystemNotification } from '../services/db';
import { cn } from '../utils/cn';

const getNotificationIcon = (type: SystemNotification['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="w-5 h-5" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5" />;
    case 'error':
      return <XCircle className="w-5 h-5" />;
    case 'payment':
      return <CreditCard className="w-5 h-5" />;
    case 'invoice':
      return <FileText className="w-5 h-5" />;
    case 'customer':
      return <User className="w-5 h-5" />;
    default:
      return <Info className="w-5 h-5" />;
  }
};

const iconColor = (type: SystemNotification['type']) => cn(
  "flex items-center justify-center shrink-0",
  type === 'success' && "text-fn-success",
  type === 'error' && "text-fn-error",
  type === 'warning' && "text-fn-warning",
  type === 'info' && "text-fn-info",
  type === 'payment' && "text-fn-success",
  type === 'invoice' && "text-lilac",
  type === 'customer' && "text-blue",
  !['success', 'error', 'warning', 'info', 'payment', 'invoice', 'customer'].includes(type) && "text-surface-50"
);

const POPUP_DURATION = 5000;

// Surfaces new notifications as transient top-right popups. Mounted once in
// Layout. Diffs incoming notifications against a "seen" set seeded from the
// initial fetch so the whole history never floods the screen.
export const NotificationPopups = () => {
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotifications();
  const { mutate: markNotificationRead } = useMarkNotificationRead();
  const [popups, setPopups] = useState<SystemNotification[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const seededRef = useRef(false);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!seededRef.current) {
      notifications.forEach(n => seenIdsRef.current.add(n.id));
      seededRef.current = true;
      return;
    }
    const fresh = notifications.filter(n => !seenIdsRef.current.has(n.id));
    if (fresh.length === 0) return;
    fresh.forEach(n => seenIdsRef.current.add(n.id));
    setPopups(prev => [...prev, ...fresh]);
    fresh.forEach(n => {
      timersRef.current[n.id] = setTimeout(() => {
        setPopups(prev => prev.filter(p => p.id !== n.id));
        delete timersRef.current[n.id];
      }, POPUP_DURATION);
    });
  }, [notifications]);

  useEffect(() => {
    const t = Object.values(timersRef.current);
    return () => t.forEach(clearTimeout);
  }, []);

  const dismiss = (id: string) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setPopups(prev => prev.filter(p => p.id !== id));
  };

  const handleOpen = (notif: SystemNotification) => {
    if (!notif.read) markNotificationRead(notif.id);
    dismiss(notif.id);
    if (notif.link) navigate(notif.link);
  };

  if (popups.length === 0) return null;

  return (
    <div className="fixed top-20 right-5 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {popups.map(notif => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 60, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-[8px] border border-border bg-off-black shadow-xl cursor-pointer"
            onClick={() => handleOpen(notif)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleOpen(notif);
            }}
          >
            <span className={cn("pt-0.5", iconColor(notif.type))}>
              {getNotificationIcon(notif.type)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-fn-info shrink-0" />
                <p className="text-[13px] font-bold text-surface-cream truncate">{notif.title}</p>
              </div>
              <p className="text-[13px] text-surface-50 mt-1 leading-[1.4] line-clamp-2 break-words">{notif.message}</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
              aria-label="Dismiss notification"
              className="shrink-0 p-1 rounded-full text-surface-50/60 hover:text-surface-cream hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
