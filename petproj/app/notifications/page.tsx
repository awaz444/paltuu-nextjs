"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { Bell, Check, Smartphone } from "lucide-react";

interface Sender {
    user_id: number;
    name: string;
    profile_image_url: string | null;
}

interface Notification {
    notification_id: string;
    type: string;
    title: string;
    body: string;
    entity_type: string | null;
    entity_id: string | null;
    deep_link: string | null;
    image_url: string | null;
    is_read: boolean;
    created_at: string;
    sender: Sender | null;
}

const SOCIAL_TYPES = new Set([
    "social_post_comment",
    "social_post_like",
    "social_new_follower",
    "social_post_reaction",
]);

const typeIcon: Record<string, { src: string; alt: string } | { emoji: string }> = {
    social_post_like:     { src: "/icons/paw-like.svg",  alt: "paw like" },
    social_post_comment:  { src: "/icons/comment.svg",   alt: "comment" },
    social_new_follower:  { src: "/icons/follow.svg",    alt: "follow" },
    social_post_reaction: { src: "/icons/repost.svg",    alt: "repost" },
    adoption_listing_approved: { emoji: "🎉" },
    adoption_new_application:  { emoji: "📋" },
    new_listing:         { emoji: "🐾" },
    application_type:    { emoji: "📋" },
    review_type:         { emoji: "⭐" },
    verification_type:   { emoji: "✅" },
};

function TypeBadge({ type }: { type: string }) {
    const icon = typeIcon[type] ?? { emoji: "🔔" };
    if ("src" in icon) {
        return <img src={icon.src} alt={icon.alt} className="w-4 h-4" />;
    }
    return <span className="text-[11px] leading-none">{icon.emoji}</span>;
}

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated || !user?.id) { setLoading(false); return; }

        const fetchNotifications = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("/api/v1/notifications", {
                    method: "GET",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                });
                if (res.status === 401) { setError("Please log in to view your notifications."); return; }
                if (!res.ok) { setError("Failed to fetch notifications."); return; }
                const data = await res.json();
                setNotifications(data.notifications || []);
            } catch {
                setError("Failed to fetch notifications.");
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [user?.id, isAuthenticated]);

    const markRead = async (notificationId: string) => {
        await fetch("/api/v1/notifications", {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notification_id: notificationId }),
        }).catch(() => {});
    };

    const handleNotificationClick = async (n: Notification) => {
        if (!n.notification_id) return;

        // Mark as read optimistically
        if (!n.is_read) {
            setNotifications((prev) =>
                prev.map((x) => x.notification_id === n.notification_id ? { ...x, is_read: true } : x)
            );
            markRead(n.notification_id);
        }

        // Social types — no web navigation (content lives in the app)
        if (SOCIAL_TYPES.has(n.type)) return;

        switch (n.type) {
            case "adoption_listing_approved": router.push("/my-listings"); break;
            case "adoption_new_application":
                router.push(n.entity_id ? `/adoption-applicants?pet_id=${n.entity_id}` : "/my-listings");
                break;
            case "new_listing": router.push("/admin-pet-approval"); break;
            case "application_type": router.push("/my-listings"); break;
            case "review_type": router.push("/vet-reviews-summary"); break;
            case "verification_type": router.push("/admin-approve-vets"); break;
        }
    };

    const handleMarkAllAsRead = async () => {
        const prev = notifications.filter((n) => !n.is_read);
        setNotifications((all) => all.map((n) => ({ ...n, is_read: true })));
        try {
            const res = await fetch("/api/v1/notifications", {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mark_all_read: true }),
            });
            if (!res.ok) throw new Error();
        } catch {
            setNotifications((all) =>
                all.map((n) => prev.some((u) => u.notification_id === n.notification_id) ? { ...n, is_read: false } : n)
            );
        }
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;
    const isSocial = (type: string) => SOCIAL_TYPES.has(type);

    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white rounded-3xl p-10 shadow-sm text-center max-w-sm w-full mx-4">
                    <p className="text-gray-500 text-sm mb-5">Please log in to view your notifications.</p>
                    <a href="/auth" className="bg-primary text-white px-6 py-3 rounded-2xl font-medium inline-block">Sign In</a>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-100">
            {/* Slim banner */}
            <div className="bg-white border-b border-gray-100">
                <div style={{ maxWidth: "90%", margin: "0 auto" }} className="py-6 px-4 md:px-8 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                        {unreadCount > 0 && (
                            <p className="text-gray-500 text-sm mt-0.5">
                                <span className="font-medium text-primary">{unreadCount}</span> unread
                            </p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-primary text-primary rounded-2xl text-sm font-medium hover:bg-primary hover:text-white transition-colors"
                        >
                            <Check size={14} /> Mark all read
                        </button>
                    )}
                </div>
            </div>

            <div style={{ maxWidth: "90%", margin: "0 auto" }} className="py-8 px-4 md:px-8 max-w-2xl">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="w-8 h-8 border-[3px] border-[#a03048] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-3xl p-8 shadow-sm">
                        <p className="text-red-500 text-sm text-center">{error}</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 shadow-sm text-center">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell size={24} className="text-gray-400" />
                        </div>
                        <h2 className="text-base font-semibold text-gray-800 mb-1">All caught up</h2>
                        <p className="text-gray-400 text-sm">No notifications yet.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                        {notifications.map((n, i) => {
                            const social = isSocial(n.type);
                            const clickable = !social;

                            return (
                                <div
                                    key={n.notification_id}
                                    onClick={() => handleNotificationClick(n)}
                                    role={clickable ? "button" : undefined}
                                    tabIndex={clickable ? 0 : undefined}
                                    onKeyDown={(e) => clickable && e.key === "Enter" && handleNotificationClick(n)}
                                    className={[
                                        "flex items-start gap-4 px-6 py-4 transition-colors",
                                        i !== notifications.length - 1 ? "border-b border-gray-100" : "",
                                        !n.is_read ? "bg-primary/[0.03]" : "",
                                        clickable ? "cursor-pointer hover:bg-gray-50" : "",
                                    ].join(" ")}
                                >
                                    {/* Avatar — sender profile pic or placeholder fallback */}
                                    <div className="flex-shrink-0 relative">
                                        <img
                                            src={n.sender?.profile_image_url || "/no-profile/no-profile.jpg"}
                                            alt={n.sender?.name || "Paltuu"}
                                            className="w-10 h-10 rounded-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).src = "/no-profile/no-profile.jpg"; }}
                                        />
                                        {/* Type badge overlaid bottom-right */}
                                        <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                            <TypeBadge type={n.type} />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm text-gray-900 leading-snug ${!n.is_read ? "font-semibold" : "font-medium"}`}>
                                            <span>{n.title}</span>{" "}
                                            <span className={!n.is_read ? "font-semibold" : "font-normal text-gray-600"}>{n.body}</span>
                                        </p>
                                        <time className="text-xs text-gray-400 mt-1 block">
                                            {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                                        </time>

                                        {/* App-only CTA for social notifications */}
                                        {social && (
                                            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                                                <Smartphone size={12} />
                                                <span>View on the Paltuu app</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Unread dot */}
                                    {!n.is_read && (
                                        <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
};

export default NotificationsPage;
