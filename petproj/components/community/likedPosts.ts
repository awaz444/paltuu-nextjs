"use client";

/**
 * Which posts the signed-in viewer has liked, looked up in one request per
 * page: every PostActions on the page asks for its post in the same tick, and
 * the ids are sent together to /api/v1/community/liked.
 */

const known = new Map<number, boolean>();
let queued = new Map<number, ((liked: boolean) => void)[]>();
let scheduled = false;

async function flush() {
    scheduled = false;
    const batch = queued;
    queued = new Map();
    let liked = new Set<number>();
    try {
        const res = await fetch(`/api/v1/community/liked?ids=${[...batch.keys()].join(",")}`, { credentials: "include" });
        if (res.ok) liked = new Set((await res.json()).liked as number[]);
    } catch {
        /* Offline or signed out: everything reads as not liked. */
    }
    for (const [id, waiters] of batch) {
        known.set(id, liked.has(id));
        waiters.forEach((w) => w(liked.has(id)));
    }
}

export function fetchLiked(postId: number): Promise<boolean> {
    if (known.has(postId)) return Promise.resolve(known.get(postId)!);
    return new Promise((resolve) => {
        queued.set(postId, [...(queued.get(postId) ?? []), resolve]);
        if (!scheduled) {
            scheduled = true;
            setTimeout(flush, 0);
        }
    });
}

/** Keeps the same post in sync when it appears twice on a page (feed + related). */
export function rememberLiked(postId: number, liked: boolean) {
    known.set(postId, liked);
}
