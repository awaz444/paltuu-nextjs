"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import type { CommunityComment } from "@/lib/community";
import Avatar from "./Avatar";
import AuthorLink from "./AuthorLink";
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

const MAX_CHARS = 2000;

function CommentEditor({
    initial,
    onSave,
    onCancel,
}: {
    initial: string;
    onSave: (text: string) => Promise<boolean>;
    onCancel: () => void;
}) {
    const [text, setText] = useState(initial);
    const [saving, setSaving] = useState(false);
    const box = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const el = box.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
    }, []);

    useEffect(() => {
        const el = box.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
    }, [text]);

    const trimmed = text.trim();
    const canSave = trimmed.length > 0 && text.length <= MAX_CHARS && trimmed !== initial.trim() && !saving;

    const save = async () => {
        if (!canSave) return;
        setSaving(true);
        const ok = await onSave(trimmed);
        setSaving(false);
        if (ok) onCancel();
    };

    return (
        <div className="mt-1">
            <textarea
                ref={box}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Escape") onCancel();
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
                }}
                rows={2}
                aria-label="Edit your reply"
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-[15px] text-gray-800 focus:border-primary focus:outline-none"
            />
            <div className="mt-1 flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-full px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={save}
                    disabled={!canSave}
                    className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                    {saving ? "Saving…" : "Save"}
                </button>
            </div>
        </div>
    );
}

function CommentItem({
    c,
    isReply = false,
    onReply,
    viewerId,
    onEdit,
}: {
    c: CommunityComment;
    isReply?: boolean;
    onReply: (comment: CommunityComment) => void;
    viewerId: number | null;
    onEdit: (commentId: number, content: string) => Promise<boolean>;
}) {
    const [editing, setEditing] = useState(false);
    // Negative ids are replies still being posted; they can be edited once saved.
    const canEdit = viewerId !== null && c.author.id === viewerId && c.id > 0;

    return (
        <li className={isReply ? "" : "px-4 py-3"}>
            <div className={`flex gap-3 ${isReply ? "mt-3" : ""}`}>
                <AuthorLink id={c.author.id} className="shrink-0">
                    <Avatar src={c.author.avatar} name={c.author.name} size={isReply ? 28 : 36} />
                </AuthorLink>
                <div className="min-w-0 flex-1">
                    <p className="text-sm">
                        <AuthorLink id={c.author.id} className="font-semibold text-gray-900 hover:underline">{c.author.name}</AuthorLink>{" "}
                        <time dateTime={c.createdAt} className="text-xs text-gray-400">
                            {formatCommentTime(c.createdAt)}
                        </time>
                    </p>
                    {editing ? (
                        <CommentEditor
                            initial={c.content}
                            onSave={(text) => onEdit(c.id, text)}
                            onCancel={() => setEditing(false)}
                        />
                    ) : (
                    <>
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
                        {canEdit && (
                            <button
                                type="button"
                                onClick={() => setEditing(true)}
                                className="font-medium text-gray-500 hover:text-primary hover:underline"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                    </>
                    )}
                </div>
            </div>
            {c.replies && c.replies.length > 0 && (
                <ul className="ml-[18px] border-l-2 border-gray-100 pl-5">
                    {c.replies.map((r) => (
                        <CommentItem key={r.id} c={r} isReply onReply={onReply} viewerId={viewerId} onEdit={onEdit} />
                    ))}
                </ul>
            )}
        </li>
    );
}

export default function PostComments() {
    const thread = usePostThread();
    const { isAuthenticated, user } = useAuth();
    const [loginModalOpen, setLoginModalOpen] = useState(false);

    if (!thread) return null;

    const { comments, openReplyModal, path, editComment } = thread;
    const viewerId = isAuthenticated ? Number(user?.id ?? user?.user_id) || null : null;

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
                        <CommentItem key={c.id} c={c} onReply={handleReplyToComment} viewerId={viewerId} onEdit={editComment} />
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

