import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, X, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications';
import type { Notification } from '@/hooks/useNotifications';

// Notification type icons mapping (for future use)
// const notificationIcons: Record<string, string> = {
//   forum_reply: 'MessageSquare',
//   comment_reply: 'MessageCircle',
//   new_message: 'Mail',
//   friend_request: 'UserPlus',
//   friend_accepted: 'Users',
//   event_reminder: 'Calendar',
//   news_published: 'Newspaper',
//   system: 'Info',
// };

function NotificationItem({
  notification,
  onMarkRead,
  onClose,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}) {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    onClose();
  };

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        notification.isRead
          ? 'bg-transparent hover:bg-gray-100 dark:hover:bg-white/5'
          : 'bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30'
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          'w-2 h-2 mt-2 rounded-full flex-shrink-0',
          notification.isRead ? 'bg-transparent' : 'bg-primary-500'
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {notification.title}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: sv,
          })}
        </p>
      </div>
      {notification.link && (
        <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
      )}
    </div>
  );

  if (notification.link) {
    return <Link to={notification.link}>{content}</Link>;
  }

  return content;
}

export default function NotificationBell() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { data: notificationsData, isLoading } = useNotifications(1, 10, false);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notificationsData?.data || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkRead = (id: string) => {
    markRead.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        aria-label={t('notifications.title', 'Notifikationer')}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-background-card rounded-xl shadow-xl border border-gray-200 dark:border-white/10 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('notifications.title', 'Notifikationer')}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    title={t('notifications.markAllRead', 'Markera alla som lästa')}
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  {t('common.loading', 'Laddar...')}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>{t('notifications.empty', 'Inga notifikationer')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={handleMarkRead}
                      onClose={() => setIsOpen(false)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-gray-200 dark:border-white/10 p-2">
                <Link
                  to="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  {t('notifications.viewAll', 'Visa alla notifikationer')}
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
