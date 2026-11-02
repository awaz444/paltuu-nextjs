"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import type { CommunityComment } from "@/lib/community";
import Avatar from "./Avatar";
import LinkifiedText from "./LinkifiedText";
import GetAppModal from "./GetAppModal";
import { usePostThread } from "./PostThreadContext";

function formatCommentTime(iso: string): string {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return format(new Date(iso), "d MMM yyyy");
}

function CommentItem({
    c,
    isReply = false,
    onReply,
}: {
    c: CommunityComment;
    isReply?: boolean;
    onReply: (comment: CommunityComment) => void;
}) {
    return (
        <li className={isReply ? "" : "px-4 py-3"}>
            <div className={`flex gap-3 ${isReply ? "mt-3" : ""}`}>
                <Avatar src={c.author.avatar} name={c.author.name} size={isReply ? 28 : 36} />
                <div className="min-w-0 flex-1">
                    <p className="text-sm">
                        <span className="font-semibold text-gray-900">{c.author.name}</span>{" "}
                        <time dateTime={c.createdAt} className="text-xs text-gray-400">
                            {formatCommentTime(c.createdAt)}
                        </time>
                    </p>
                    <p className="mt-0.5 whitespace-pre-line break-words text-[15px] text-gray-800">
                        <LinkifiedText text={c.content} />
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        {c.likeCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-gray-400">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/icons/social/paw-like-unselect.svg" alt="" width={14} height={14} />{" "}
                                {c.likeCount}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => onReply(c)}
                            className="font-medium text-gray-500 hover:text-primary hover:underline"
                        >
                            Reply
                        </button>
                    </div>
                </div>
            </div>
            {c.replies && c.replies.length > 0 && (
                <ul className="ml-[18px] border-l-2 border-gray-100 pl-5">
                    {c.replies.map((r) => (
                        <CommentItem key={r.id} c={r} isReply onReply={onReply} />
                    ))}
                </ul>
            )}
        </li>
    );
}

export default function PostComments() {
    const thread = usePostThread();
    const { isAuthenticated } = useAuth();
    const [loginModalOpen, setLoginModalOpen] = useState(false);

    if (!thread) return null;

    const { comments, openReplyModal, path } = thread;

    const handleReplyToComment = (c: CommunityComment) => {
        if (!isAuthenticated) {
            setLoginModalOpen(true);
            return;
        }
        openReplyModal({
            author: c.author,
            excerpt: c.content,
            parentCommentId: c.id,
        });
    };

    const handleReplyToPost = () => {
        if (!isAuthenticated) {
            setLoginModalOpen(true);
            return;
        }
        openReplyModal();
    };

    const signInHref = `/auth?callbackUrl=${encodeURIComponent(path)}`;

    return (
        <section aria-labelledby="comments-heading" className="border-t border-gray-200">
            <h2 id="comments-heading" className="px-4 pb-1 pt-3 text-sm font-semibold text-gray-700">
                Replies
            </h2>
            {comments.length > 0 ? (
                <ul className="divide-y divide-gray-100 pb-2">
                    {comments.map((c) => (
                        <CommentItem key={c.id} c={c} onReply={handleReplyToComment} />
                    ))}
                </ul>
            ) : (
                <p className="px-4 pb-4 text-sm text-gray-500">
                    No replies yet.{" "}
                    <button
                        type="button"
                        onClick={handleReplyToPost}
                        className="font-medium text-primary hover:underline"
                    >
                        Be the first to reply.
                    </button>
                </p>
            )}

            <GetAppModal
                open={loginModalOpen}
                onClose={() => setLoginModalOpen(false)}
                title="Log in to reply"
                body="Use your Paltuu account, the same one as in the app. New here? Signing up is free."
                signInHref={signInHref}
            />
        </section>
    );
}

