import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Info, CheckCircle2, AlertTriangle, XCircle, CreditCard, FileText, User, ChevronRight } from 'lucide-react';
import { useNotifications, useClearNotifications, useMarkNotificationRead, useDeleteNotification, useDeleteAllNotifications } from '../../api/queries';
import { SystemNotification } from '../../services/db';
import { cn } from '../../utils/cn';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatDistanceToNow } from 'date-fns';

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

const iconBgClass = (type: SystemNotification['type']) => cn(
  "w-[44px] h-[44px] rounded-[8px] flex items-center justify-center shrink-0 transition-colors duration-200",
  type === 'success' && "bg-fn-success/10 text-fn-success",
  type === 'error' && "bg-fn-error/10 text-fn-error",
  type === 'warning' && "bg-fn-warning/10 text-fn-warning",
  type === 'info' && "bg-fn-info/10 text-fn-info",
  type === 'payment' && "bg-fn-success/10 text-fn-success",
  type === 'invoice' && "bg-lilac/10 text-lilac",
  type === 'customer' && "bg-blue/10 text-blue",
  !['success', 'error', 'warning', 'info', 'payment', 'invoice', 'customer'].includes(type) && "bg-muted/10 text-surface-50"
);

const getRelativeTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const diffInMs = Date.now() - date.getTime();
    if (diffInMs < 30000) return 'Just now';
    const distance = formatDistanceToNow(date, { addSuffix: true });
    return distance.replace('less than a minute ago', 'Just now').replace('about ', '').replace('almost ', '');
  } catch {
    return 'Just now';
  }
};

export const Notifications = () => {
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotifications();
  const { mutate: clearNotifications } = useClearNotifications();
  const { mutate: markNotificationRead } = useMarkNotificationRead();
  const { mutate: deleteNotification } = useDeleteNotification();
  const { mutate: deleteAllNotifications } = useDeleteAllNotifications();

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClick = (notif: SystemNotification) => {
    if (!notif.read) markNotificationRead(notif.id);
    if (notif.link) navigate(notif.link);
  };

  const handleClearAll = () => {
    if (window.confirm('Delete all notifications? This cannot be undone.')) {
      deleteAllNotifications();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <PageHeader
          title="Notifications"
          description={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'You are all caught up'}
        />
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" onClick={() => clearNotifications()}>
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </Button>
            )}
            <Button variant="ghost" onClick={handleClearAll} className="text-fn-error hover:text-fn-error">
              <Trash2 className="w-4 h-4" />
              Clear all
            </Button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-20 flex flex-col items-center justify-center gap-4 text-center">
            <div className="p-5 bg-muted/40 rounded-full text-surface-50">
              <Bell className="w-10 h-10" />
            </div>
            <h4 className="text-[18px] font-semibold text-surface-cream">No notifications yet</h4>
            <p className="text-[14px] text-surface-50 max-w-sm">Things like leave requests, payment releases, and attendance finalizations will show up here.</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-3"
        >
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleClick(notif)}
              className={cn(
                "group flex items-start gap-4 p-4 md:p-5 rounded-[10px] border bg-card cursor-pointer transition-all duration-200 hover:bg-muted",
                !notif.read ? "border-primary/30" : "border-border"
              )}
            >
              <div className={iconBgClass(notif.type)}>
                {getNotificationIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[15px] font-semibold text-surface-cream truncate">{notif.title}</h4>
                  {!notif.read && (
                    <span className="shrink-0 text-[10px] bg-primary/10 text-shockingly-green px-2 py-0.5 rounded-full font-bold">Unread</span>
                  )}
                </div>
                <p className="text-[14px] text-surface-50 mt-1 leading-[1.4]">{notif.message}</p>
                <p className="text-[12px] text-surface-50/60 mt-1.5 font-medium">{getRelativeTime(notif.createdAt)}</p>
              </div>
              {notif.link && (
                <div className="shrink-0 self-center text-surface-50/40 group-hover:text-surface-cream group-hover:translate-x-0.5 transition-all duration-200">
                  <ChevronRight className="w-5 h-5" />
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notif.id);
                }}
                aria-label="Delete notification"
                title="Delete notification"
                className="shrink-0 self-center p-2 rounded-full text-surface-50/40 hover:text-fn-error hover:bg-fn-error/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};
