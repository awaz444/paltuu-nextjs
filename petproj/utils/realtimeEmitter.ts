/**
 * Real-time emitter utility for Next.js API routes.
 *
 * Instead of maintaining a Socket.io instance inside Next.js (which doesn't
 * support persistent connections well), this sends a POST to the internal
 * emitter API on the real-time server.
 *
 * Usage:
 *   import { emitToRoom } from "@/utils/realtimeEmitter";
 *   await emitToRoom(`post:${postId}`, "post:liked", { postId, like_count });
 *
 * If the real-time server is not running, it fails silently — never breaks the API.
 */

const EMITTER_URL = process.env.REALTIME_EMITTER_URL || "http://localhost:3002";
const INTERNAL_KEY = process.env.REALTIME_INTERNAL_KEY || "";

export async function emitToRoom(
    room: string,
    event: string,
    data: Record<string, any>
): Promise<void> {
    if (!INTERNAL_KEY) return; // Real-time server not configured — skip silently

    try {
        await fetch(EMITTER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-internal-key": INTERNAL_KEY,
            },
            body: JSON.stringify({ event, room, data }),
            signal: AbortSignal.timeout(1000), // 1 second timeout — never block the API
        });
    } catch {
        // Silent fail — real-time is a bonus, not critical path
    }
}

/**
 * Emit a like update to everyone viewing the post
 */
export async function emitLike(postId: string | number, userId: number, likeCount: number, liked: boolean) {
    await emitToRoom(`post:${postId}`, "post:liked", { postId, userId, like_count: likeCount, liked });
}

/**
 * Emit a new comment to everyone viewing the post
 */
export async function emitComment(postId: string | number, comment: Record<string, any>) {
    await emitToRoom(`post:${postId}`, "post:commented", { postId, comment });
}

/**
 * Emit a repost event to everyone viewing the post
 */
export async function emitRepost(postId: string | number, userId: number, repostCount: number) {
    await emitToRoom(`post:${postId}`, "post:reposted", { postId, userId, repost_count: repostCount });
}

/**
 * Emit a notification to a specific user
 */
export async function emitNotification(recipientUserId: number, notification: Record<string, any>) {
    await emitToRoom(`user:${recipientUserId}`, "notification:new", notification);
}

/**
 * Emit a follow event to the followed user
 */
export async function emitFollow(followedUserId: number, followerData: Record<string, any>) {
    await emitToRoom(`user:${followedUserId}`, "follow:new", followerData);
}
