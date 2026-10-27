"use client";

import { useState } from "react";

/** Same icons as the app's PostCard (assets/icons/*-unselect.svg in paltuu-reactnative). */
const ICON = {
    like: "/icons/social/paw-like-unselect.svg",
    comment: "/icons/social/comment-unselect.svg",
    repost: "/icons/social/repost-unselect.svg",
    share: "/icons/social/share-unselect.svg",
};

function Count({ icon, label, value }: { icon: string; label: string; value: number }) {
    return (
        <span className="inline-flex items-center gap-1.5" aria-label={`${value} ${label}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={icon} alt="" width={20} height={20} className="h-5 w-5" />
            <span aria-hidden>{value}</span>
        </span>
    );
}

/**
 * Like / reply / repost counts and a share button. Counts are read-only on the
 * web (liking and replying happen in the app). Share uses the phone's share
 * sheet when there is one, and copies the link otherwise.
 */
export default function PostActions({
    likes,
    comments,
    reposts,
    path,
    title,
}: {
    likes: number;
    comments: number;
    reposts: number;
    path: string;
    title: string;
}) {
    const [copied, setCopied] = useState(false);

    const share = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
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

    return (
        <div className="flex items-center gap-5 text-sm font-medium text-gray-600">
            <Count icon={ICON.like} label="likes" value={likes} />
            <Count icon={ICON.comment} label="replies" value={comments} />
            <Count icon={ICON.repost} label="reposts" value={reposts} />
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
        </div>
    );
}
