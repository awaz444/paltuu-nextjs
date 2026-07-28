/**
 * Redis client — uses Upstash REST API via @upstash/redis
 * Works in both Node.js and Edge runtimes (no native tcp socket needed).
 *
 * Falls back gracefully if UPSTASH_REDIS_REST_URL is not set.
 */

import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

function getRedis(): Redis | null {
    if (_redis) return _redis;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        return null; // Redis not configured — callers handle gracefully
    }

    _redis = new Redis({ url, token });
    return _redis;
}

export const redis = new Proxy({} as Redis, {
    get(_target, prop) {
        const client = getRedis();
        if (!client) {
            // Return a no-op function for any method call when Redis is unavailable
            return async (..._args: any[]) => null;
        }
        return (client as any)[prop].bind(client);
    },
});

export function isRedisAvailable(): boolean {
    return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// ─── Feed Cache Helpers ───────────────────────────────────────────────────────

const FEED_TTL = 60 * 60 * 24; // 24 hours
const MAX_FEED_SIZE = 500;       // Max posts per user's cached feed

/**
 * Add a new post to all followers' feed caches (fan-out on write).
 * Called after a post is created.
 */
export async function fanOutPostToFollowers(
    postId: string | bigint,
    authorId: number,
    createdAt: Date,
    db: any
): Promise<void> {
    if (!isRedisAvailable()) return;

    try {
        // Fetch all followers
        const result = await db.query(
            "SELECT follower_id FROM social_follows WHERE following_id = $1 AND status = 'accepted'",
            [authorId]
        );

        if (result.rows.length === 0) return;

        const score = new Date(createdAt).getTime();
        const member = String(postId);

        // Pipeline all writes for efficiency
        const pipeline = (redis as any).pipeline?.();

        if (pipeline) {
            for (const { follower_id } of result.rows) {
                const key = `feed:${follower_id}`;
                pipeline.zadd(key, { score, member });
                pipeline.zremrangebyrank(key, 0, -(MAX_FEED_SIZE + 1)); // Trim oldest
                pipeline.expire(key, FEED_TTL);
            }
            // Also add to author's own feed
            const selfKey = `feed:${authorId}`;
            pipeline.zadd(selfKey, { score, member });
            pipeline.zremrangebyrank(selfKey, 0, -(MAX_FEED_SIZE + 1));
            pipeline.expire(selfKey, FEED_TTL);

            await pipeline.exec();
        } else {
            // Fallback: sequential writes (Upstash REST doesn't support pipeline in all configs)
            for (const { follower_id } of result.rows) {
                const key = `feed:${follower_id}`;
                await redis.zadd(key, { score, member });
                await redis.expire(key, FEED_TTL);
            }
        }
    } catch (err) {
        // Non-critical — log and continue
        console.warn("[redis] fanOutPostToFollowers failed:", err);
    }
}

/**
 * Remove a post from all caches (called on delete/undo-repost).
 */
export async function removePostFromCaches(postId: string | bigint, authorId: number, db: any): Promise<void> {
    if (!isRedisAvailable()) return;

    try {
        const result = await db.query(
            "SELECT follower_id FROM social_follows WHERE following_id = $1 AND status = 'accepted'",
            [authorId]
        );

        const member = String(postId);
        for (const { follower_id } of result.rows) {
            await redis.zrem(`feed:${follower_id}`, member);
        }
        await redis.zrem(`feed:${authorId}`, member);
    } catch (err) {
        console.warn("[redis] removePostFromCaches failed:", err);
    }
}

/**
 * Get cached feed post IDs for a user.
 * Returns null on cache miss (caller should fall back to DB).
 */
export async function getCachedFeedIds(
    userId: number,
    cursor: number | null,
    limit: number
): Promise<string[] | null> {
    if (!isRedisAvailable()) return null;

    try {
        const key = `feed:${userId}`;

        // @upstash/redis uses zrange with rev + byScore instead of zrevrangebyscore
        const ids = await redis.zrange(key, cursor ?? "+inf", "-inf", {
            rev: true,
            byScore: true,
            offset: cursor ? 1 : 0, // skip the cursor item itself
            count: limit,
        }) as string[];

        return ids.length > 0 ? ids : null;
    } catch {
        return null;
    }
}

/**
 * Cache a single post object.
 *
 * `postId` may be a plain post id (`post:{id}`) or a viewer-scoped composite
 * key such as `{postId}:{viewerId}` (`post:{postId}:{viewerId}`) — required
 * whenever the cached row contains viewer-specific fields (is_liked,
 * is_reposted, is_saved, is_commented), since those must never be shared
 * across viewers. See lib/feedHydration.ts.
 */
export async function cachePost(postId: string | bigint, post: Record<string, any>): Promise<void> {
    if (!isRedisAvailable()) return;
    try {
        await redis.setex(`post:${postId}`, 60 * 30, JSON.stringify(post)); // 30 min TTL
    } catch { }
}

/**
 * Get cached post by ID (or viewer-scoped composite key — see cachePost).
 */
export async function getCachedPost(postId: string | bigint): Promise<Record<string, any> | null> {
    if (!isRedisAvailable()) return null;
    try {
        const raw = await redis.get(`post:${postId}`) as string | null;
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/**
 * Invalidate a post's cache entry (call after likes/comments update).
 */
export async function invalidatePostCache(postId: string | bigint): Promise<void> {
    if (!isRedisAvailable()) return;
    try {
        await redis.del(`post:${postId}`);
    } catch { }
}

/**
 * Invalidate a single viewer's cached copy of a post (composite key
 * `{postId}:{viewerId}`). Use this after a mutation performed BY that viewer
 * (like/unlike, save/unsave, repost/undo, comment) so their own next fetch
 * reflects the change immediately. Other viewers' cached copies of the same
 * post are intentionally left to expire via the existing 30 min TTL rather
 * than tracking every viewer who ever cached a given post — those viewers
 * will see fresh counts within the TTL window, matching the accepted
 * staleness tradeoff already used for engagement counts.
 */
export async function invalidateViewerPostCache(postId: string | bigint, viewerId: number): Promise<void> {
    return invalidatePostCache(`${postId}:${viewerId}`);
}

// ─── Surfaced-Comment Dedupe ──────────────────────────────────────────────────
// Tracks which "popular reply on a private post" comment cards a viewer has
// already been shown, so the same comment doesn't reappear in their feed on
// every cold start. A plain SET (membership only, no ordering needed) with a
// whole-key TTL — same idiom as the feed:{userId} ZSET cache above.

/**
 * Comment IDs already surfaced to this viewer (still within their cooldown
 * window). Returns [] if Redis is unavailable — fails closed on injection
 * (see posts/route.ts) rather than risk repeat-showing the same card.
 */
export async function getSurfacedCommentIds(userId: number): Promise<string[]> {
    if (!isRedisAvailable()) return [];
    try {
        const ids = await redis.smembers(`surfaced_comments:${userId}`);
        return (ids as string[]) ?? [];
    } catch {
        return [];
    }
}

/**
 * Record that this comment was just shown to this viewer as a feed card.
 * TTL is refreshed on every write so the whole set expires together
 * (Redis SETs have no per-member TTL).
 */
export async function markCommentSurfaced(
    userId: number,
    commentId: string | bigint,
    ttlDays: number
): Promise<void> {
    if (!isRedisAvailable()) return;
    try {
        const key = `surfaced_comments:${userId}`;
        await redis.sadd(key, String(commentId));
        await redis.expire(key, ttlDays * 86400);
    } catch { }
}
