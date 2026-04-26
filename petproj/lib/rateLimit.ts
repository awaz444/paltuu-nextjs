/**
 * Social API Rate Limiter
 * Uses Upstash Redis sliding window counters — no extra package needed.
 *
 * Usage in any API route:
 *   import { rateLimit, LIMITS } from "@/lib/rateLimit";
 *
 *   const limited = await rateLimit(req, LIMITS.LIKE);
 *   if (limited) return limited; // returns 429 NextResponse automatically
 */

import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// ── Client ──────────────────────────────────────────────────────────────────
let _redis: Redis | null = null;

function getRedis(): Redis | null {
    if (_redis) return _redis;
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    _redis = new Redis({ url, token });
    return _redis;
}

// ── Limit Presets ─────────────────────────────────────────────────────────
export const LIMITS = {
    // Action           : [max requests, window in seconds]
    POST_CREATE:          [10,  3600],  // 10 posts per hour
    LIKE:                 [120, 60],    // 120 likes per minute
    COMMENT:              [30,  60],    // 30 comments per minute
    REPOST:               [20,  3600],  // 20 reposts per hour
    FOLLOW:               [60,  3600],  // 60 follows per hour
    UPLOAD:               [20,  3600],  // 20 uploads per hour
    FEED:                 [120, 60],    // 120 feed loads per minute (generous)
    NOTIFICATION_READ:    [30,  60],    // 30 mark-reads per minute
} as const;

type LimitPreset = (typeof LIMITS)[keyof typeof LIMITS];

/**
 * Sliding window rate limiter.
 *
 * @param req      - The incoming Next.js request
 * @param preset   - One of LIMITS.*  e.g. LIMITS.LIKE
 * @param keyExtra - Optional extra string to namespace the key (e.g. postId)
 *
 * @returns null if allowed, or a NextResponse(429) if rate limited
 */
export async function rateLimit(
    req: NextRequest,
    preset: LimitPreset,
    keyExtra?: string
): Promise<NextResponse | null> {
    const redis = getRedis();
    if (!redis) return null; // Redis not configured — allow all (fail open)

    const [maxRequests, windowSeconds] = preset;

    // Identify the caller by IP (mobile) or user token header
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const token = req.cookies.get("token")?.value?.slice(-16) ?? ip;

    const key = `rl:${maxRequests}:${windowSeconds}:${token}${keyExtra ? `:${keyExtra}` : ""}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    try {
        // Sliding window: store each request timestamp as a sorted set member
        const pipeline = redis.pipeline();
        pipeline.zremrangebyscore(key, 0, windowStart);          // remove old entries
        pipeline.zadd(key, { score: now, member: `${now}` });    // add this request
        pipeline.zcard(key);                                      // count in window
        pipeline.expire(key, windowSeconds + 1);                  // auto-cleanup

        const results = await pipeline.exec() as any[];
        const count = results[2] as number;

        if (count > maxRequests) {
            const retryAfter = Math.ceil(windowSeconds - (now - windowStart) / 1000);
            return NextResponse.json(
                {
                    error: "Too many requests",
                    message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
                    retry_after: retryAfter,
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(retryAfter),
                        "X-RateLimit-Limit": String(maxRequests),
                        "X-RateLimit-Window": String(windowSeconds),
                        "X-RateLimit-Remaining": "0",
                    },
                }
            );
        }

        return null; // ✅ Allowed

    } catch {
        // Redis error — fail open (never break the API due to rate limiter)
        return null;
    }
}
