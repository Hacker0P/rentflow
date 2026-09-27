'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Wrench,
  CreditCard,
  CheckCheck,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'PAYMENT_REPORTED' | 'PAYMENT_CONFIRMED' | 'INVOICE_GENERATED' | 'MAINTENANCE_UPDATE' | 'SYSTEM';
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export function NotificationBell({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await apiRequest<{ notifications: NotificationItem[]; unreadCount: number }>(
        '/notifications'
      );
      if (res?.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Silently catch if user is logged out or offline
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Live polling every 12 seconds
    const interval = setInterval(fetchNotifications, 12000);

    // Also refetch when window gains focus
    const onFocus = () => fetchNotifications();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, link?: string | null) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Error marking as read', e);
    }

    if (link) {
      setIsOpen(false);
      router.push(link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setIsLoading(true);
      await apiRequest('/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Error marking all as read', e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'PAYMENT_REPORTED':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
        );
      case 'PAYMENT_CONFIRMED':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case 'MAINTENANCE_UPDATE':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
    }
  };

  const displayedNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className={`relative p-2 rounded-xl transition active:scale-95 ${
          variant === 'light'
            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        aria-label="Notifications"
        title="Live Activity & Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse shadow-md shadow-emerald-600/40">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu / Mobile Viewport Clamped Panel */}
      {isOpen && (
        <>
          {/* Mobile backdrop for outside tap dismissal */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 sm:hidden animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed top-18 inset-x-3 max-w-sm mx-auto sm:max-w-none sm:mx-0 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-96 bg-white border border-slate-200 text-slate-900 rounded-3xl shadow-2xl shadow-slate-900/15 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={isLoading}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-50 transition disabled:opacity-50"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center px-4 py-2 border-b border-slate-100 gap-1.5 bg-white">
              <button
                onClick={() => setActiveTab('all')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                  activeTab === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                  activeTab === 'unread'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Notification List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
              {displayedNotifications.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center mx-auto mb-2.5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">All caught up!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {activeTab === 'unread'
                      ? 'No unread notifications right now.'
                      : 'No notifications or alerts yet.'}
                  </p>
                </div>
              ) : (
                displayedNotifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleMarkAsRead(item.id, item.link)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition cursor-pointer group ${
                      !item.isRead ? 'bg-emerald-50/25' : ''
                    }`}
                  >
                    {getNotificationIcon(item.type)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-xs font-bold truncate ${
                            !item.isRead ? 'text-slate-900' : 'text-slate-600'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                        {item.message}
                      </p>

                      {item.link && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-1.5 group-hover:text-emerald-700 transition">
                          View Details
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                        </span>
                      )}
                    </div>

                    {!item.isRead && (
                      <div className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1 shadow-xs" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
