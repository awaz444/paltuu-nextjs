"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import type { CommunityProfile } from "@/lib/community";

/** A post as /api/v1/social/profile/[id] returns it. */
export type ApiPost = {
    post_id: number;
    content: string | null;
    created_at: string;
    is_repost?: boolean;
    like_count?: number;
    comment_count?: number;
    media?: { media_type?: string; url?: string; thumbnail_url?: string | null }[];
};

export type Viewer = {
    loaded: boolean;
    isOwn: boolean;
    isFollowing: boolean;
    isPending: boolean;
    followsMe: boolean;
    blockedByMe: boolean;
    blockingMe: boolean;
    /** Private and not followed, or blocked in either direction. Posts are hidden. */
    locked: boolean;
    posts: ApiPost[];
};

const NO_VIEWER: Viewer = {
    loaded: false,
    isOwn: false,
    isFollowing: false,
    isPending: false,
    followsMe: false,
    blockedByMe: false,
    blockingMe: false,
    locked: false,
    posts: [],
};

type Ctx = {
    profile: CommunityProfile;
    viewer: Viewer;
    isSignedIn: boolean;
    refresh: () => Promise<void>;
    setProfile: (patch: Partial<CommunityProfile>) => void;
    tab: string;
    setTab: (tab: string) => void;
};

const ProfileContext = createContext<Ctx | null>(null);

export function useProfile(): Ctx {
    const ctx = useContext(ProfileContext);
    if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
    return ctx;
}

/** Holds the profile and what the current visitor can do with it. The page itself is cached and knows neither. */
export function ProfileProvider({ initial, children }: { initial: CommunityProfile; children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [profile, setProfileState] = useState(initial);
    const [viewer, setViewer] = useState<Viewer>({ ...NO_VIEWER, locked: initial.isPrivate });
    const [tab, setTabState] = useState("posts");

    const refresh = useCallback(async () => {
        try {
            const res = await fetch(`/api/v1/social/profile/${initial.id}`, { credentials: "include" });
            if (!res.ok) return;
            const data = await res.json();
            const p = data.profile;
            if (data.suspended || !p) return;
            setProfileState((prev) => ({
                ...prev,
                name: p.name || prev.name,
                username: p.social_username || prev.username,
                bio: p.bio ?? null,
                avatar: p.profile_image_url || prev.avatar,
                cover: p.cover_photo_url ?? null,
                followerCount: p.follower_count ?? prev.followerCount,
                followingCount: p.following_count ?? prev.followingCount,
                postCount: p.post_count ?? prev.postCount,
                isPrivate: Boolean(p.is_private),
            }));
            setViewer({
                loaded: true,
                isOwn: Boolean(p.is_own_profile),
                isFollowing: Boolean(p.is_following),
                isPending: Boolean(p.has_pending_request),
                followsMe: Boolean(p.is_following_me),
                blockedByMe: Boolean(p.is_blocked_by_me),
                blockingMe: Boolean(p.is_blocking_me),
                locked: Boolean(data.is_private_locked),
                posts: data.posts ?? [],
            });
        } catch {
            // The cached page stays usable; the visitor just doesn't get the actions.
        }
    }, [initial.id]);

    useEffect(() => {
        refresh();
    }, [refresh, isAuthenticated]);

    // ?tab= keeps a tab linkable and survives a refresh.
    useEffect(() => {
        const fromUrl = new URLSearchParams(window.location.search).get("tab");
        if (fromUrl) setTabState(fromUrl);
    }, []);

    const setTab = useCallback((next: string) => {
        setTabState(next);
        const url = new URL(window.location.href);
        if (next === "posts") url.searchParams.delete("tab");
        else url.searchParams.set("tab", next);
        window.history.replaceState(null, "", url.toString());
    }, []);

    const setProfile = useCallback((patch: Partial<CommunityProfile>) => {
        setProfileState((prev) => ({ ...prev, ...patch }));
    }, []);

    const value = useMemo(
        () => ({ profile, viewer, isSignedIn: isAuthenticated, refresh, setProfile, tab, setTab }),
        [profile, viewer, isAuthenticated, refresh, setProfile, tab, setTab]
    );

    return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
