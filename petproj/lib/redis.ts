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
            "SELECT follower_id FROM social_follows WHERE following_id = $1",
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
            "SELECT follower_id FROM social_follows WHERE following_id = $1",
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
 */
export async function cachePost(postId: string | bigint, post: Record<string, any>): Promise<void> {
    if (!isRedisAvailable()) return;
    try {
        await redis.setex(`post:${postId}`, 60 * 30, JSON.stringify(post)); // 30 min TTL
    } catch { }
}

/**
 * Get cached post by ID.
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
