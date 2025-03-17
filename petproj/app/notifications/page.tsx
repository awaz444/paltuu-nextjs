'use client';

import Navbar from '@/components/navbar';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPrimaryColor } from '../hooks/useSetPrimaryColor';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface Notification {
  notification_id: string;
  notification_content: string;
  date_sent: string;
  is_read: boolean;
  notification_type: string;
}

const NotificationsPage = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  useSetPrimaryColor();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userString = localStorage.getItem('user');
      if (!userString) {
        setError('User data not found in local storage');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userString);
      const user_id = user?.id;
      if (!user_id) {
        setError('User ID is missing from the user object');
        setLoading(false);
        return;
      }

      setUserId(user_id);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotifications(userId);
    }
  }, [userId]);

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
      <Navbar />
      <div className="container min-h-screen mx-auto p-4 mb-60 max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {notifications.some(n => !n.is_read) && (
            <button 
              onClick={handleMarkAllAsRead}
              className="text-primary-600 hover:text-primary-800 text-sm font-medium transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

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