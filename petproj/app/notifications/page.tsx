'use client';

import Navbar from '@/components/navbar';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPrimaryColor } from '../hooks/useSetPrimaryColor';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useSession } from "next-auth/react";
import { useAuth } from "@/context/AuthContext";

interface Notification {
  notification_id: string;
  notification_content: string;
  date_sent: string;
  is_read: boolean;
  notification_type: string;
}

const NotificationsPage = () => {
  const { data: session, status } = useSession();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Get userId from session
  const userId = user?.id || (session?.user as any)?.user_id || null;

  useEffect(() => {
    // Wait for session to load
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (!userId) {
      setError('Please log in to view notifications');
      setLoading(false);
      return;
    }

    fetchNotifications(userId);
  }, [userId, status]);

  const fetchNotifications = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/get-notifications-by-id/${userId}`);
      if (response.ok) {
        const data: Notification[] = await response.json();
        setNotifications(data);
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.notification_id) return;

      if (!notification.is_read) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.notification_id === notification.notification_id
              ? { ...notif, is_read: true }
              : notif
          )
        );

        await fetch(`/api/mark-notification-read/${notification.notification_id}`, {
          method: 'PUT',
        });
      }

      switch (notification.notification_type) {
        case 'new_listing':
          router.push('/admin-pet-approval');
          break;
        case 'application_type':
          userId && router.push(`/my-listings`);
          break;
        case 'review_type':
          router.push('/vet-reviews-summary');
          break;
        case 'verification_type':
          router.push('/admin-approve-vets');
          break;
        default:
          console.warn(`Unknown notification type: ${notification.notification_type}`);
      }
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;

    // Store the current state of unread notifications
    const currentUnreadNotifications = notifications.filter(n => !n.is_read);

    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

      const response = await fetch(`/api/mark-all-notifications-read/${userId}`, {
        method: 'PUT',
      });

      if (!response.ok) throw new Error('Failed to mark all as read');
    } catch (err) {
      console.error(err);
      // Revert optimistic update for previously unread notifications
      setNotifications(prev => prev.map(n =>
        currentUnreadNotifications.some(un => un.notification_id === n.notification_id)
          ? { ...n, is_read: false }
          : n
      ));
    }
  };

  const formatTimestamp = (isoString: string) => {
    const date = parseISO(isoString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
  {/* Notifications Header */}
  <header className="bg-white text-primary border border-1 border-primary p-8 rounded-2xl shadow-lg mb-10">
    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="bg-primary flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center shadow-lg">
          <img className="p-3" src="/favicon-dark.png" alt="paltuu logo" />
        </div>

        <div className="text-center md:text-left">
          <h1 className="text-3xl text-black md:text-4xl font-bold mb-2">
            Notifications
          </h1>
          <p className="text-black text-lg">
            Stay updated with your latest activities and alerts
          </p>
        </div>
      </div>

      {notifications.some(n => !n.is_read) && (
        <button
          onClick={handleMarkAllAsRead}
          className="px-5 py-2.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-all flex items-center gap-2 font-small shadow-md whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Mark all as read
        </button>
      )}
    </div>
  </header>



        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-100 animate-pulse rounded-lg"
                data-testid="loading-skeleton"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg mb-2">📭</div>
            No notifications found
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.notification_id}
                className={`
                  group p-4 rounded-lg transition-all cursor-pointer
                  ${notification.is_read
                    ? 'bg-white hover:bg-gray-50'
                    : 'bg-primary-50 border-l-4 border-primary-600'
                  }
                  hover:shadow-sm border border-gray-200
                `}
                onClick={() => handleNotificationClick(notification)}
                role="button"
                tabIndex={0}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className={`text-gray-900 ${!notification.is_read ? 'font-semibold' : ''}`}>
                      {notification.notification_content}
                    </p>
                    <time
                      className="text-sm text-gray-500 mt-1 block"
                      title={parseISO(notification.date_sent).toLocaleString()}
                    >
                      {formatTimestamp(notification.date_sent)}
                    </time>
                  </div>
                  {!notification.is_read && (
                    <div className="ml-4 p-1">
                      <span className="w-2 h-2 bg-primary-600 rounded-full block" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationsPage;