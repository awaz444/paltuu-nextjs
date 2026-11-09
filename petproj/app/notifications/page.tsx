"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import {
    Bell,
    CheckCircle,
    ChevronRight,
    ClipboardList,
    Heart,
    Info,
    MessageCircle,
    PawPrint,
    Repeat,
    Smartphone,
    UserPlus,
    XCircle,
    type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authUrl } from "@/lib/authRedirect";
import { AccountPage, Avatar, EmptyState, FilterTabs, SignInPrompt, Spinner, btn, cardClass } from "@/components/account/ui";

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

type FilterKey = "all" | "unread";

const PAGE_SIZE = 20;

const isSocial = (type: string) => type.startsWith("social_");

/** Small lucide icon for each notification type. */
function iconFor(type: string): LucideIcon {
    switch (type) {
        case "social_post_like":
        case "social_comment_like":
            return Heart;
        case "social_post_comment":
        case "social_comment_reply":
        case "social_mention_post":
        case "social_mention_comment":
            return MessageCircle;
        case "social_new_follower":
        case "social_follow_request":
        case "social_follow_request_accepted":
            return UserPlus;
        case "social_repost":
        case "social_post_reaction":
            return Repeat;
        case "adoption_new_application":
        case "application_type":
            return ClipboardList;
        case "adoption_application_approved":
        case "verification_type":
            return CheckCircle;
        case "adoption_application_rejected":
            return XCircle;
        case "adoption_listing_approved":
        case "adoption_availability_check":
        case "adoption_listing_paused":
        case "adoption_new_listing_match":
        case "new_listing":
            return PawPrint;
        default:
            return Bell;
    }
}

/** Path on our own site from an http(s) deep link, or null. */
function sitePathFromDeepLink(deepLink: string | null): string | null {
    if (!deepLink || !/^https?:\/\//i.test(deepLink) || typeof window === "undefined") return null;
    try {
        const url = new URL(deepLink);
        const host = url.hostname.replace(/^www\./, "");
        const ownHost = window.location.hostname.replace(/^www\./, "");
        if (host !== ownHost && host !== "paltuu.pk") return null;
        return `${url.pathname}${url.search}${url.hash}` || "/";
    } catch {
        return null;
    }
}

/** Where a notification takes you on the web, or null when it doesn't navigate. */
function hrefFor(n: Notification): string | null {
    if (isSocial(n.type)) return null;
    switch (n.type) {
        // entity_id is the APPLICATION id here, not the pet id.
        case "adoption_new_application":
            return n.entity_id ? `/my-listings?application=${encodeURIComponent(n.entity_id)}` : "/my-listings";
        case "adoption_application_approved":
        case "adoption_application_rejected":
            return "/my-applications";
        case "adoption_listing_approved":
        case "adoption_availability_check":
        case "adoption_listing_paused":
            return "/my-listings";
        // Legacy admin notifications
        case "new_listing":
            return "/admin-pet-approval";
        case "application_type":
            return "/my-listings";
        case "review_type":
            return "/vet-reviews-summary";
        case "verification_type":
            return "/admin-approve-vets";
        default:
            return sitePathFromDeepLink(n.deep_link);
    }
}

type GroupKey = "Today" | "Yesterday" | "This week" | "Earlier";
const GROUP_ORDER: GroupKey[] = ["Today", "Yesterday", "This week", "Earlier"];

function groupFor(createdAt: string, now: Date): GroupKey {
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return "Earlier";
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    if (differenceInCalendarDays(now, d) < 7) return "This week";
    return "Earlier";
}

function timeAgo(createdAt: string) {
    const d = new Date(createdAt);
    return Number.isNaN(d.getTime()) ? "" : formatDistanceToNow(d, { addSuffix: true });
}

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterKey>("all");
    const router = useRouter();
    const { user, isAuthenticated, isHydrating } = useAuth();
    const requestId = useRef(0);

    const fetchPage = useCallback(async (cursor: number) => {
        const res = await fetch(`/api/v1/notifications?limit=${PAGE_SIZE}&cursor=${cursor}`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        if (res.status === 401) throw new Error("Please sign in again to see your notifications.");
        if (!res.ok) throw new Error("We couldn't load your notifications.");
        return (await res.json()) as { notifications?: Notification[]; unread_count?: number; next_cursor?: number | null };
    }, []);

    const loadFirstPage = useCallback(async () => {
        const id = ++requestId.current;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchPage(0);
            if (id !== requestId.current) return;
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count ?? 0);
            setNextCursor(data.next_cursor ?? null);
        } catch (e) {
            if (id === requestId.current) setError(e instanceof Error ? e.message : "We couldn't load your notifications.");
        } finally {
            if (id === requestId.current) setLoading(false);
        }
    }, [fetchPage]);

    useEffect(() => {
        if (isHydrating) return;
        if (!isAuthenticated || !user?.id) {
            setLoading(false);
            return;
        }
        loadFirstPage();
    }, [user?.id, isAuthenticated, isHydrating, loadFirstPage]);

    const loadMore = async () => {
        if (nextCursor === null || loadingMore) return;
        setLoadingMore(true);
        try {
            const data = await fetchPage(nextCursor);
            setNotifications((prev) => {
                const seen = new Set(prev.map((n) => String(n.notification_id)));
                return [...prev, ...(data.notifications || []).filter((n) => !seen.has(String(n.notification_id)))];
            });
            if (typeof data.unread_count === "number") setUnreadCount(data.unread_count);
            setNextCursor(data.next_cursor ?? null);
        } catch {
            // Keep what we have; the button stays so the user can try again.
        } finally {
            setLoadingMore(false);
        }
    };

    const markRead = async (notificationId: string) => {
        await fetch("/api/v1/notifications", {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notification_id: notificationId }),
        }).catch(() => {});
    };

    const handleNotificationClick = (n: Notification) => {
        if (!n.notification_id) return;

        // Mark as read optimistically
        if (!n.is_read) {
            setNotifications((prev) => prev.map((x) => (x.notification_id === n.notification_id ? { ...x, is_read: true } : x)));
            setUnreadCount((c) => Math.max(0, c - 1));
            markRead(n.notification_id);
        }

        const href = hrefFor(n);
        if (href) router.push(href);
    };

    const handleMarkAllAsRead = async () => {
        const prevUnread = notifications.filter((n) => !n.is_read).map((n) => n.notification_id);
        const prevCount = unreadCount;
        setNotifications((all) => all.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        try {
            const res = await fetch("/api/v1/notifications", {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mark_all_read: true }),
            });
            if (!res.ok) throw new Error();
        } catch {
            setNotifications((all) => all.map((n) => (prevUnread.includes(n.notification_id) ? { ...n, is_read: false } : n)));
            setUnreadCount(prevCount);
        }
    };

    const visible = useMemo(() => (filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications), [notifications, filter]);

    const groups = useMemo(() => {
        const now = new Date();
        const map = new Map<GroupKey, Notification[]>();
        visible.forEach((n) => {
            const g = groupFor(n.created_at, now);
            if (!map.has(g)) map.set(g, []);
            map.get(g)!.push(n);
        });
        return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({ label: g, items: map.get(g)! }));
    }, [visible]);

    if (isHydrating) {
        return (
            <AccountPage title="Notifications">
                <Spinner label="Loading notifications" />
            </AccountPage>
        );
    }

    if (!isAuthenticated || !user) {
        return <SignInPrompt message="Sign in to see your notifications." next={authUrl("/notifications")} />;
    }

    const subtitle = loading || error ? undefined : unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up";

    return (
        <AccountPage
            title="Notifications"
            subtitle={subtitle}
            actions={
                !loading && unreadCount > 0 ? (
                    <button type="button" onClick={handleMarkAllAsRead} className={btn.secondary}>
                        Mark all as read
                    </button>
                ) : undefined
            }>
            <div className="mx-auto max-w-3xl">
                {loading ? (
                    <Spinner label="Loading notifications" />
                ) : error ? (
                    <EmptyState
                        icon={<Info size={22} />}
                        title="Couldn't load notifications"
                        body={error}
                        action={
                            <button type="button" onClick={loadFirstPage} className={btn.secondary}>
                                Try again
                            </button>
                        }
                    />
                ) : notifications.length === 0 ? (
                    <EmptyState
                        icon={<Bell size={22} />}
                        title="No notifications yet"
                        body="Updates on your listings, applications and posts will show up here."
                    />
                ) : (
                    <>
                        <div className="mb-5">
                            <FilterTabs<FilterKey>
                                label="Filter notifications"
                                value={filter}
                                onChange={setFilter}
                                tabs={[
                                    { key: "all", label: "All" },
                                    { key: "unread", label: "Unread", count: unreadCount },
                                ]}
                            />
                        </div>

                        {groups.length === 0 ? (
                            <EmptyState
                                icon={<Bell size={22} />}
                                title="No unread notifications"
                                body="You're all caught up."
                                action={
                                    <button type="button" onClick={() => setFilter("all")} className={btn.secondary}>
                                        Show all
                                    </button>
                                }
                            />
                        ) : (
                            <div className="space-y-6">
                                {groups.map((g) => (
                                    <section key={g.label} aria-labelledby={`group-${g.label}`}>
                                        <h2 id={`group-${g.label}`} className="mb-2 px-1 text-sm font-semibold text-gray-900">
                                            {g.label}
                                        </h2>
                                        <ul className={`${cardClass} divide-y divide-gray-100 overflow-hidden`}>
                                            {g.items.map((n) => (
                                                <li key={n.notification_id}>
                                                    <NotificationRow n={n} onClick={() => handleNotificationClick(n)} />
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                ))}
                            </div>
                        )}

                        {nextCursor !== null && (
                            <div className="mt-6 flex justify-center">
                                <button type="button" onClick={loadMore} disabled={loadingMore} className={btn.secondary}>
                                    {loadingMore ? "Loading…" : "Load more"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AccountPage>
    );
};

function NotificationRow({ n, onClick }: { n: Notification; onClick: () => void }) {
    const social = isSocial(n.type);
    const navigates = hrefFor(n) !== null;
    const Icon = iconFor(n.type);
    const unread = !n.is_read;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 sm:px-5 ${
                unread ? "bg-primary-faint" : ""
            }`}>
            <span className="relative shrink-0">
                {n.sender ? (
                    <>
                        <Avatar src={n.sender.profile_image_url} name={n.sender.name} size={40} />
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-gray-100 bg-white text-primary">
                            <Icon size={11} strokeWidth={2.25} />
                        </span>
                    </>
                ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-tint text-primary">
                        <Icon size={18} />
                    </span>
                )}
            </span>

            <span className="min-w-0 flex-1">
                {social ? (
                    <span className="block text-sm leading-snug text-gray-600">
                        <span className="font-semibold text-gray-900">{n.title}</span> {n.body}
                    </span>
                ) : (
                    <>
                        <span className="block text-sm font-semibold leading-snug text-gray-900">{n.title}</span>
                        {n.body && <span className="mt-0.5 block text-sm leading-snug text-gray-600">{n.body}</span>}
                    </>
                )}
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <time dateTime={n.created_at}>{timeAgo(n.created_at)}</time>
                    {social && (
                        <span className="inline-flex items-center gap-1">
                            <Smartphone size={12} />
                            Open in the Paltuu app
                        </span>
                    )}
                </span>
            </span>

            <span className="flex shrink-0 items-center gap-2 self-center">
                {unread && (
                    <>
                        <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                        <span className="sr-only">Unread</span>
                    </>
                )}
                {navigates && (
                    <ChevronRight size={16} className="text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                )}
            </span>
        </button>
    );
}

export default NotificationsPage;
