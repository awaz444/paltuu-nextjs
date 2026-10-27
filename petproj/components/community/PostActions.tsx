"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import GetAppModal from "./GetAppModal";
import ReplyModal, { type ReplyTarget } from "./ReplyModal";
import { fetchLiked, rememberLiked } from "./likedPosts";

/** Same icons as the app's PostCard (assets/icons/*-select / -unselect.svg in paltuu-reactnative). */
const ICON = {
    like: "/icons/social/paw-like-unselect.svg",
    liked: "/icons/social/paw-like-select.svg",
    comment: "/icons/social/comment-unselect.svg",
    repost: "/icons/social/repost-unselect.svg",
    share: "/icons/social/share-unselect.svg",
};

type Prompt = "signin-like" | "signin-reply" | "repost" | null;

function ActionButton({
    icon,
    label,
    value,
    active,
    onClick,
}: {
    icon: string;
    label: string;
    value: number;
    active?: boolean;
    onClick: (e: React.MouseEvent) => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            aria-pressed={active}
            // z-10 lifts the button above the card's full-size link overlay in the feed.
            className={`relative z-10 -mx-1.5 inline-flex items-center gap-1.5 rounded-full px-1.5 py-1 hover:bg-gray-100 ${active ? "text-primary" : ""}`}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={icon} alt="" width={20} height={20} className="h-5 w-5" />
            <span aria-hidden>{value}</span>
        </button>
    );
}

/**
 * Like / reply / repost / share for one post. Liking and replying work on the
 * web for signed-in users (signed-out visitors are asked to log in); reposting
 * stays in the app, so it opens a get-the-app prompt.
 */
export default function PostActions({
    postId,
    likes,
    comments,
    reposts,
    path,
    title,
    author,
    excerpt,
}: {
    postId: number;
    likes: number;
    comments: number;
    reposts: number;
    path: string;
    title: string;
    author: ReplyTarget["author"];
    excerpt: string;
}) {
    const { isAuthenticated } = useAuth();
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(likes);
    const [commentCount, setCommentCount] = useState(comments);
    const [busy, setBusy] = useState(false);
    const [replying, setReplying] = useState(false);
    const [prompt, setPrompt] = useState<Prompt>(null);
    const [copied, setCopied] = useState(false);

    // The page is cached for everyone; the viewer's own like is filled in here.
    useEffect(() => {
        if (!isAuthenticated) {
            setLiked(false);
            return;
        }
        let live = true;
        fetchLiked(postId).then((v) => live && setLiked(v));
        return () => {
            live = false;
        };
    }, [isAuthenticated, postId]);

    const stop = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const toggleLike = async (e: React.MouseEvent) => {
        stop(e);
        if (!isAuthenticated) return setPrompt("signin-like");
        if (busy) return;
        setBusy(true);
        // Optimistic: flip now, settle on the server's answer.
        const next = !liked;
        setLiked(next);
        setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
        try {
            const res = await fetch(`/api/v1/social/posts/${postId}/like`, { method: "POST", credentials: "include" });
            if (res.status === 401) {
                setLiked(!next);
                setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)));
                setPrompt("signin-like");
                return;
            }
            if (!res.ok) throw new Error(String(res.status));
            const body = await res.json();
            setLiked(body.liked);
            setLikeCount(body.like_count);
            rememberLiked(postId, body.liked);
        } catch {
            setLiked(!next);
            setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)));
        } finally {
            setBusy(false);
        }
    };

    const openReply = (e: React.MouseEvent) => {
        stop(e);
        if (!isAuthenticated) return setPrompt("signin-reply");
        setReplying(true);
    };

    const share = async (e: React.MouseEvent) => {
        stop(e);
        const url = `${window.location.origin}${path}`;
        try {
            if (navigator.share) {
                await navigator.share({ title, url });
                return;
            }
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            /* Share sheet dismissed, or clipboard blocked: nothing to do. */
        }
    };

    const signInHref = `/auth?callbackUrl=${encodeURIComponent(path)}`;

    return (
        // Counts take the icons' grey (#BABABA, from the -unselect SVGs) so number and icon read as one.
        <div className="flex items-center gap-5 text-sm font-medium text-[#BABABA]">
            <ActionButton icon={liked ? ICON.liked : ICON.like} label={liked ? "Unlike" : "Like"} value={likeCount} active={liked} onClick={toggleLike} />
            <ActionButton icon={ICON.comment} label="Reply" value={commentCount} onClick={openReply} />
            <ActionButton icon={ICON.repost} label="Repost" value={reposts} onClick={(e) => { stop(e); setPrompt("repost"); }} />
            <button
                type="button"
                onClick={share}
                className="relative z-10 ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-1 hover:bg-gray-100"
                aria-label="Share this post"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ICON.share} alt="" width={20} height={20} className="h-5 w-5" />
                <span className="text-xs">{copied ? "Link copied" : "Share"}</span>
            </button>

            {/* Modals portal to <body>; this wrapper stops their clicks reaching the feed card's link. */}
            <span className="contents" onClick={(e) => e.stopPropagation()}>
                <ReplyModal
                    open={replying}
                    onClose={() => setReplying(false)}
                    target={{ postId, path, author, excerpt }}
                    onPosted={() => setCommentCount((c) => c + 1)}
                />
                <GetAppModal
                    open={prompt === "repost"}
                    onClose={() => setPrompt(null)}
                    title="Repost in the Paltuu app"
                    body="Reposting is only in the app for now. Get it to share this post with your followers."
                />
                <GetAppModal
                    open={prompt === "signin-like" || prompt === "signin-reply"}
                    onClose={() => setPrompt(null)}
                    title={prompt === "signin-reply" ? "Log in to reply" : "Log in to like this post"}
                    body="Use your Paltuu account, the same one as in the app. New here? Signing up is free."
                    signInHref={signInHref}
                />
            </span>
        </div>
    );
}
