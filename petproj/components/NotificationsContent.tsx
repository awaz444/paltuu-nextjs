"use client";

import React, { useEffect, useState } from "react";
import { formatDistanceToNow, parseISO } from 'date-fns';

interface Notification {
  notification_id: string;
  notification_content: string;
  date_sent: string;
  is_read: boolean;
  notification_type: string;
}

export default function NotificationsContent() {
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userString = localStorage.getItem('user');
      if (!userString) {
        setError('User data not found in local storage');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userString);
      const id = user?.id || user?.user_id;
      if (!id) {
        setError('User ID is missing from the user object');
        setLoading(false);
        return;
      }

      setUserId(id);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotifications(userId);
    }
  }, [userId]);

  const fetchNotifications = async (uid: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/get-notifications-by-id/${uid}`);
      if (response.ok) {
        const data: Notification[] = await response.json();
        setNotifications(data);
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (err) {
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    const currentUnread = notifications.filter(n => !n.is_read);
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      const response = await fetch(`/api/mark-all-notifications-read/${userId}`, { method: 'PUT' });
      if (!response.ok) throw new Error('Failed');
    } catch {
      setNotifications(prev => prev.map(n => currentUnread.some(u => u.notification_id === n.notification_id) ? { ...n, is_read: false } : n));
    }
  };

  const formatTimestamp = (isoString: string) => {
    const date = parseISO(isoString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="container mx-auto p-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={handleMarkAllAsRead}
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-100">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No notifications found</div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.notification_id}
              className={`p-4 rounded-lg transition-all border ${notification.is_read ? 'bg-white hover:bg-gray-50 border-gray-200' : 'bg-primary/5 border-primary/40'}`}
            >
              <p className={`text-gray-900 ${!notification.is_read ? 'font-semibold' : ''}`}>{notification.notification_content}</p>
              <time className="text-sm text-gray-500 mt-1 block">{formatTimestamp(notification.date_sent)}</time>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


