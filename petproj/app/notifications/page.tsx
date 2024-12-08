'use client';

import Navbar from '@/components/navbar';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPrimaryColor } from '../hooks/useSetPrimaryColor';

// Define Notification interface
interface Notification {
  notification_id: string; // Unique identifier for the notification
  notification_content: string; // The content/message of the notification
  date_sent: string; // The date the notification was sent
  is_read: boolean; // Whether the notification has been read
  notification_type: string; // Type of notification (e.g., 'new_listing')
}

const NotificationsPage = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  useSetPrimaryColor();

  // Effect to retrieve user ID from localStorage
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

  // Effect to fetch notifications after userId is set
  useEffect(() => {
    if (userId) {
      fetchNotifications(userId);
    }
  }, [userId]);

  // Function to fetch notifications
  const fetchNotifications = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/get-notifications-by-id/${userId}`);
      if (response.ok) {
        const data: Notification[] = await response.json(); // Type the response
        console.log('Fetched Notifications:', data);
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

  // Function to handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    try {
      
      if (!notification.notification_id) {
        console.error('Notification ID is missing:', notification);
        return;
      }

      // Check if the notification is already read
      if (!notification.is_read) {
        // Optimistic UI update: Set the notification as read locally
        setNotifications((prevNotifications) =>
          prevNotifications.map((notif) =>
            notif.notification_id === notification.notification_id
              ? { ...notif, is_read: true }
              : notif
          )
        );

        // Mark the notification as read via the API
        const response = await fetch(`/api/mark-notification-read/${notification.notification_id}`, {
          method: 'PUT',
        });

        if (!response.ok) {
          console.error('Failed to mark notification as read:', await response.text());
          // Revert UI update in case of error
          setNotifications((prevNotifications) =>
            prevNotifications.map((notif) =>
              notif.notification_id === notification.notification_id
                ? { ...notif, is_read: false }
                : notif
            )
          );
          throw new Error('Failed to mark notification as read');
        }

        console.log(`Notification ${notification.notification_id} marked as read.`);
      }

      // Redirect based on the notification type
      switch (notification.notification_type) {
        case 'new_listing':
          router.push('/admin-pet-approval');
          break;
      
        case 'application_type':
          if (userId) {
            router.push(`/my-listings`);
          } else {
            console.error('User ID is missing for application_type notification.');
          }
          break;
      
        case 'review_type':
          router.push('/vet-reviews-summary');
          break;
      
        case 'verification_type':
          router.push('/admin-approve-vets');
          break;
      
        default:
          console.warn(`Unknown notification type: ${notification.notification_type}`);
          break;
      }
      
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4 mb-60">
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : notifications.length === 0 ? (
          <p>No notifications available</p>
        ) : (
          <ul>
            {notifications.map((notification) => (
              <li
                key={notification.notification_id}
                className={`mb-4 p-2 border border-gray-300 rounded cursor-pointer ${
                  notification.is_read === false ? 'text-primary font-bold' : 'text-gray-500'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <p>{notification.notification_content}</p>
                <span className="text-sm text-gray-500">{notification.date_sent}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default NotificationsPage;
