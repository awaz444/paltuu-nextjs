"use client";

import Navbar from "@/components/navbar";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { MoonLoader } from "react-spinners";

interface Notification {
  notification_id: string;
  notification_content: string;
  date_sent: string;
  is_read: boolean;
  notification_type: string;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [primaryColor, setPrimaryColor] = useState("#000000");

  // Fetch notifications when authenticated using AuthContext (My Listings convention)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/get-notifications-by-id", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (response.status === 401) {
          // Unauthorized – stay on page; show error
          setError("Unauthorized. Please log in.");
          return;
        }

        if (!response.ok) {
          setError("Failed to fetch notifications");
          return;
        }

        const data: Notification[] = await response.json();
        setNotifications(data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user?.id, isAuthenticated, router]);

  // Derive primary color for spinner display (same convention as My Listings)
  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const color = rootStyles.getPropertyValue("--primary-color").trim();
    if (color) {
      setPrimaryColor(color);
    }
  }, []);

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
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
      }

      switch (notification.notification_type) {
        case "new_listing":
          router.push("/admin-pet-approval");
          break;
        case "application_type":
          router.push(`/my-listings`);
          break;
        case "review_type":
          router.push("/vet-reviews-summary");
          break;
        case "verification_type":
          router.push("/admin-approve-vets");
          break;
        default:
          console.warn(`Unknown notification type: ${notification.notification_type}`);
      }
    } catch (err) {
      console.error("Error handling notification click:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    // Store the current state of unread notifications
    const currentUnreadNotifications = notifications.filter((n) => !n.is_read);

    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

      const response = await fetch(`/api/mark-all-notifications-read`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to mark all as read");
    } catch (err) {
      console.error(err);
      // Revert optimistic update for previously unread notifications
      setNotifications((prev) =>
        prev.map((n) =>
          currentUnreadNotifications.some((un) => un.notification_id === n.notification_id)
            ? { ...n, is_read: false }
            : n
        )
      );
    }
  };

  const formatTimestamp = (isoString: string) => {
    const date = parseISO(isoString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <>
      {/* Authentication guard matching My Listings convention */}
      {!isAuthenticated || !user ? (
        <div className="flex flex-col justify-center items-center min-h-screen text-center">
          <MoonLoader size={30} color={primaryColor} />
          <p className="mt-4 text-gray-600">Please log in to view your notifications.</p>
        </div>
      ) : (
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
      
      {/* {notifications.some(n => !n.is_read) && (
        <button 
          onClick={handleMarkAllAsRead}
          className="px-5 py-2.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-all flex items-center gap-2 font-small shadow-md whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Mark all as read
        </button>
      )} */}
    </div>
  </header>



        {loading ? (
          <div className="flex justify-center items-center min-h-screen">
            <MoonLoader size={30} color={primaryColor} />
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
      )}
    </>
  );
};

export default NotificationsPage;