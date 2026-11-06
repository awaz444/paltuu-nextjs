"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import type { CommunityComment } from "@/lib/community";
import ReplyModal, { type ReplyTarget } from "./ReplyModal";

function renderMentions(text: string | null | undefined): string {
    return (text ?? "").replace(/\{([@#])\}\[([^\]]+)\]\((?:user|pet|tag|hashtag):\d+\)/g, "$1$2").trim();
}

type ReplyTargetInput = {
    author: { id?: number; name: string; username: string | null; avatar: string | null };
    excerpt: string;
    parentCommentId?: number | null;
};

interface PostThreadContextType {
    postId: number;
    path: string;
    comments: CommunityComment[];
    commentCount: number;
    openReplyModal: (targetInput?: ReplyTargetInput) => void;
    closeReplyModal: () => void;
    addComment: (content: string, target: ReplyTarget) => Promise<void>;
}

const PostThreadContext = createContext<PostThreadContextType | null>(null);

export function usePostThread() {
    return useContext(PostThreadContext);
}

export function PostThreadProvider({
    postId,
    path,
    postAuthor,
    postExcerpt,
    initialComments,
    initialCommentCount,
    children,
}: {
    postId: number;
    path: string;
    postAuthor: { name: string; username: string | null; avatar: string | null };
    postExcerpt: string;
    initialComments: CommunityComment[];
    initialCommentCount: number;
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const [comments, setComments] = useState<CommunityComment[]>(initialComments);
    const [commentCount, setCommentCount] = useState<number>(initialCommentCount);
    const [isReplyOpen, setIsReplyOpen] = useState(false);
    const [activeTarget, setActiveTarget] = useState<ReplyTarget | null>(null);

    const defaultPostTarget: ReplyTarget = {
        postId,
        path,
        author: postAuthor,
        excerpt: postExcerpt,
        parentCommentId: null,
    };

    const openReplyModal = useCallback(
        (targetInput?: ReplyTargetInput) => {
            if (targetInput) {
                setActiveTarget({
                    postId,
                    path,
                    author: targetInput.author,
                    excerpt: targetInput.excerpt,
                    parentCommentId: targetInput.parentCommentId ?? null,
                });
            } else {
                setActiveTarget(defaultPostTarget);
            }
            setIsReplyOpen(true);
        },
        [postId, path, postAuthor, postExcerpt]
    );

    const closeReplyModal = useCallback(() => {
        setIsReplyOpen(false);
        setActiveTarget(null);
    }, []);

    const rollbackOptimistic = useCallback((tempId: number) => {
        setComments((prev) => {
            const filteredRoots = prev.filter((r) => r.id !== tempId);
            return filteredRoots.map((r) => ({
                ...r,
                replies: (r.replies || []).filter((rep) => rep.id !== tempId),
            }));
        });
        setCommentCount((prev) => Math.max(0, prev - 1));
    }, []);

    const reconcileOptimistic = useCallback((tempId: number, created: any) => {
        const realId = Number(created.comment_id);
        const parentId = created.parent_comment_id ? Number(created.parent_comment_id) : null;
        const rootId = created.root_comment_id ? Number(created.root_comment_id) : null;
        const newContent = renderMentions(created.content);
        const createdAt = created.created_at || new Date().toISOString();

        setComments((prev) => {
            // First check if realId is already present (deduping)
            const hasRealId = prev.some((r) => r.id === realId || (r.replies && r.replies.some((rep) => rep.id === realId)));
            if (hasRealId) {
                const filteredRoots = prev.filter((r) => r.id !== tempId);
                return filteredRoots.map((r) => ({
                    ...r,
                    replies: (r.replies || []).filter((rep) => rep.id !== tempId),
                }));
            }

            return prev.map((root) => {
                if (root.id === tempId) {
                    return {
                        ...root,
                        id: realId,
                        parentId,
                        rootId,
                        content: newContent || root.content,
                        createdAt,
                    };
                }
                if (root.replies && root.replies.length > 0) {
                    return {
                        ...root,
                        replies: root.replies.map((rep) => {
                            if (rep.id === tempId) {
                                return {
                                    ...rep,
                                    id: realId,
                                    parentId,
                                    rootId,
                                    content: newContent || rep.content,
                                    createdAt,
                                };
                            }
                            return rep;
                        }),
                    };
                }
                return root;
            });
        });
    }, []);

    const addComment = useCallback(
        async (content: string, target: ReplyTarget) => {
            const tempId = -Date.now() - Math.floor(Math.random() * 1000);
            const parentCommentId = target.parentCommentId ?? null;

            const optimisticComment: CommunityComment = {
                id: tempId,
                parentId: parentCommentId,
                rootId: null,
                content: renderMentions(content),
                likeCount: 0,
                createdAt: new Date().toISOString(),
                author: {
                    name: user?.name || "You",
                    username: (user as any)?.social_username || (user as any)?.username || null,
                    avatar: user?.profile_image_url || null,
                    verified: Boolean((user as any)?.verified),
                },
                replies: [],
            };

            // 1. Optimistic insertion in state
            if (!parentCommentId) {
                setComments((prev) => [...prev, optimisticComment]);
            } else {
                setComments((prev) => {
                    let found = false;
                    const next = prev.map((root) => {
                        const isTargetRoot =
                            root.id === parentCommentId ||
                            (root.replies && root.replies.some((rep) => rep.id === parentCommentId));
                        if (isTargetRoot) {
                            found = true;
                            optimisticComment.rootId = root.id;
                            return {
                                ...root,
                                replies: [...(root.replies || []), optimisticComment],
                            };
                        }
                        return root;
                    });
                    return found ? next : [...prev, optimisticComment];
                });
            }

            // 2. Bump comment count immediately
            setCommentCount((prev) => prev + 1);

            // 3. Background server reconciliation
            (async () => {
                try {
                    const res = await fetch(`/api/v1/social/posts/${postId}/comments`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            content,
                            ...(parentCommentId ? { parent_comment_id: parentCommentId } : {}),
                        }),
                    });

                    if (res.status === 401) {
                        rollbackOptimistic(tempId);
                        window.location.href = `/auth?callbackUrl=${encodeURIComponent(path)}`;
                        return;
                    }

                    if (!res.ok) {
                        const body = await res.json().catch(() => ({}));
                        rollbackOptimistic(tempId);
                        toast.error(body.error || "Couldn't post your reply. Please try again.");
                        return;
                    }

                    const created = await res.json();
                    reconcileOptimistic(tempId, created);

                    if (created.moderation_state === "redacted") {
                        toast("Some words were hidden according to Community Guidelines.", {
                            icon: "⚠️",
                        });
                    }

                    // Invalidate Next.js cache for future visits / hard refresh
                    fetch("/api/v1/community/refresh-post", {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ postId }),
                    }).catch(() => {});
                } catch {
                    rollbackOptimistic(tempId);
                    toast.error("Couldn't post your reply. Check your connection and try again.");
                }
            })();
        },
        [postId, path, user, rollbackOptimistic, reconcileOptimistic]
    );

    return (
        <PostThreadContext.Provider
            value={{
                postId,
                path,
                comments,
                commentCount,
                openReplyModal,
                closeReplyModal,
                addComment,
            }}
        >
            {children}
            {isReplyOpen && activeTarget && (
                <ReplyModal
                    open={isReplyOpen}
                    onClose={closeReplyModal}
                    target={activeTarget}
                    onPosted={() => {}}
                    onSubmitComment={addComment}
                />
            )}
        </PostThreadContext.Provider>
    );
}

