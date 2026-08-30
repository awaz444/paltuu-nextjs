/**
 * Social API Rate Limiter
 * Uses Upstash Redis fixed window counters — no extra package needed.
 *
 * Usage in any API route:
 *   import { rateLimit, LIMITS } from "@/lib/rateLimit";
 *
 *   const limited = await rateLimit(req, LIMITS.LIKE);
 *   if (limited) return limited; // returns 429 NextResponse automatically
 *
 * For read-heavy, low-risk routes (e.g. feed loads) pass { blocking: false }
 * to fire the Redis check without awaiting it — the request proceeds
 * immediately and is only ever denied on the *next* call once the limiter
 * catches up. Trades strict enforcement accuracy for removing the Redis
 * round-trip from the critical path.
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
    MENTION_SUGGEST:      [120, 60],    // 120 suggestion fetches per minute (debounced keystrokes)
    // Vets at Home request creation. A real pet owner books a home visit a handful of
    // times a year, never in bursts — a burst is either a stuck retry loop or someone
    // manufacturing jobs to self-assign (see lib/expressVet/selfDealGuard.ts). Tight on
    // purpose: legitimate users never come near it, and each request rings every on-duty
    // dispatcher's phone, so the abuse ceiling matters more than headroom here.
    EXPRESS_VET_REQUEST:  [5,   3600],  // 5 Vets at Home requests per hour
    // Dispatcher editing a Vets at Home provider profile (their own or a teammate's),
    // incl. the is_active toggle which hits the same endpoint. A real edit session is
    // a handful of saves; a burst is the Save button being spammed or a retry loop.
    // Well clear of any legitimate editing.
    EXPRESS_VET_PROVIDER_UPDATE: [20, 60],  // 20 provider edits per minute
} as const;

type LimitPreset = (typeof LIMITS)[keyof typeof LIMITS];

/**
 * Fixed window rate limiter (single INCR+EXPIRE pipeline, one Redis round-trip).
 *
 * @param req      - The incoming Next.js request
 * @param preset   - One of LIMITS.*  e.g. LIMITS.LIKE
 * @param keyExtra - Optional extra string to namespace the key (e.g. postId)
 * @param opts.blocking - Default true. When false, the Redis check is fired
 *                        without being awaited and the request is always
 *                        allowed to proceed immediately (best-effort limiting).
 * @param opts.message  - Optional override for the user-facing `message` field
 *                        on the 429 body (the generic "Rate limit exceeded…"
 *                        default otherwise).
 *
 * @returns null if allowed, or a NextResponse(429) if rate limited
 */
export async function rateLimit(
    req: NextRequest,
    preset: LimitPreset,
    keyExtra?: string,
    opts?: { blocking?: boolean; message?: string }
): Promise<NextResponse | null> {
    const redis = getRedis();
    if (!redis) return null; // Redis not configured — allow all (fail open)

    const [maxRequests, windowSeconds] = preset;

    // Identify the caller by IP (mobile) or user token header
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const token = req.cookies.get("token")?.value?.slice(-16) ?? ip;

    // Fixed window: bucket by the current window index so the key itself
    // rotates every windowSeconds — no need to prune old entries.
    const windowIdx = Math.floor(Date.now() / 1000 / windowSeconds);
    const key = `rl:${maxRequests}:${windowSeconds}:${token}${keyExtra ? `:${keyExtra}` : ""}:${windowIdx}`;

    const check = async (): Promise<NextResponse | null> => {
        try {
            const pipeline = redis.pipeline();
            pipeline.incr(key);                        // count this request in the window
            pipeline.expire(key, windowSeconds + 1);   // auto-cleanup shortly after window ends

            const results = await pipeline.exec() as any[];
            const count = results[0] as number;

            if (count > maxRequests) {
                const retryAfter = windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds);
                return NextResponse.json(
                    {
                        error: "Too many requests",
                        message: opts?.message ?? `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
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
    };

    if (opts?.blocking === false) {
        // Best-effort: don't hold up the request on the Redis round-trip.
        // Swallow the result (and any rejection) — this call can only ever
        // deny a *future* request, never the current one.
        void check().catch(() => {});
        return null;
    }

    return check();
}
