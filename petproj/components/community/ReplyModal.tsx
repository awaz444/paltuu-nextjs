"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Modal from "./Modal";

const MAX_CHARS = 2000;

export type ReplyTarget = {
    postId: number;
    path: string;
    author: { name: string; username: string | null; avatar: string | null };
    excerpt: string;
};

function Face({ src, size = 40 }: { src: string | null | undefined; size?: number }) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src || "/no-profile/no-profile.jpg"}
            alt=""
            aria-hidden
            width={size}
            height={size}
            className="shrink-0 rounded-full bg-gray-100 object-cover"
            style={{ width: size, height: size }}
        />
    );
}

/**
 * Reply composer, laid out like x.com's: the post you're answering on top,
 * joined by a thread line to your own avatar and the text box. Full screen on
 * phones, a centered dialog on desktop.
 */
export default function ReplyModal({
    open,
    onClose,
    target,
    onPosted,
}: {
    open: boolean;
    onClose: () => void;
    target: ReplyTarget;
    onPosted: () => void;
}) {
    const { user } = useAuth();
    const router = useRouter();
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const box = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (open) setTimeout(() => box.current?.focus(), 0);
        else setError(null);
    }, [open]);

    // Grow with the text instead of scrolling inside a small box.
    useEffect(() => {
        const el = box.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
    }, [text, open]);

    const trimmed = text.trim();
    const over = text.length > MAX_CHARS;
    const canSend = trimmed.length > 0 && !over && !sending;

    const send = async () => {
        if (!canSend) return;
        setSending(true);
        setError(null);
        try {
            const res = await fetch(`/api/v1/social/posts/${target.postId}/comments`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: trimmed }),
            });
            if (res.status === 401) {
                window.location.href = `/auth?callbackUrl=${encodeURIComponent(target.path)}`;
                return;
            }
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(body.error || "Couldn't post your reply. Please try again.");
                return;
            }
            // Rebuild the cached post page so the reply is there when it reloads.
            await fetch("/api/v1/community/refresh-post", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId: target.postId }),
            }).catch(() => {});
            setText("");
            onPosted();
            onClose();
            if (window.location.pathname === target.path) router.refresh();
            else router.push(target.path);
        } catch {
            setError("Couldn't post your reply. Check your connection and try again.");
        } finally {
            setSending(false);
        }
    };

    const replyButton = (
        <button
            type="button"
            onClick={send}
            disabled={!canSend}
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white transition-opacity disabled:opacity-50"
        >
            {sending ? "Replying…" : "Reply"}
        </button>
    );

    return (
        <Modal open={open} onClose={onClose} label="Reply to post" fullScreenOnMobile>
            {/* Phones: the Reply button sits top right, as on x.com. */}
            <div className="flex h-14 items-center justify-end px-4 sm:hidden">{replyButton}</div>

            <div className="flex-1 overflow-y-auto px-4 pb-2 sm:pt-12">
                <div className="flex gap-3">
                    <div className="flex shrink-0 flex-col items-center">
                        <Face src={target.author.avatar} />
                        <span aria-hidden className="mt-1 w-0.5 flex-1 bg-gray-200" />
                    </div>
                    <div className="min-w-0 pb-4">
                        <p className="truncate text-sm">
                            <span className="font-bold text-gray-900">{target.author.name}</span>
                            {target.author.username && <span className="text-gray-500"> @{target.author.username}</span>}
                        </p>
                        {target.excerpt && (
                            <p className="mt-0.5 line-clamp-4 whitespace-pre-line text-sm text-gray-800 [overflow-wrap:anywhere]">{target.excerpt}</p>
                        )}
                        <p className="mt-3 text-sm text-gray-500">
                            Replying to <span className="text-primary">{target.author.username ? `@${target.author.username}` : target.author.name}</span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Face src={user?.profile_image_url} />
                    <textarea
                        ref={box}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && send()}
                        placeholder="Post your reply"
                        rows={3}
                        className="min-h-[96px] w-full resize-none border-0 bg-transparent pt-2 text-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                    />
                </div>
                {error && <p className="ml-[52px] mt-1 text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-4 py-3">
                <span className={`text-xs ${over ? "font-semibold text-red-600" : "text-gray-400"}`}>
                    {text.length > MAX_CHARS - 200 ? `${MAX_CHARS - text.length}` : ""}
                </span>
                <span className="hidden sm:block">{replyButton}</span>
            </div>
        </Modal>
    );
}
