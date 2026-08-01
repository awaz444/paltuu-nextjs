import { db } from "@/db/index";
import { cachePost, getCachedPost } from "@/lib/redis";
import { HYDRATE_POSTS_BY_IDS_QUERY, redactUnavailableOriginals } from "@/lib/feedQueryFragments";

/**
 * Hydrate a list of post IDs (e.g. read from the Redis feed:{userId} ZSET)
 * into full post rows, reassembled in the original (recency) order.
 *
 * Tries the per-post cache first, batches a single Postgres query for cache
 * misses, and re-caches freshly hydrated rows. Any ID that fails to hydrate
 * (post deleted, hidden, or blocked since it was cached) is silently dropped
 * from the result — callers should treat a shorter-than-expected result as a
 * signal to fall back to the full feed query rather than serve a partial list.
 *
 * The cached row includes viewer-specific fields (is_liked, is_reposted,
 * is_saved, is_commented), so the cache key MUST be scoped per-viewer
 * (`postId:viewerId`), not just per-post — otherwise one viewer's engagement
 * flags would leak into another viewer's cached copy of the same post.
 */
function cacheKey(postId: string, viewerId: number): string {
    return `${postId}:${viewerId}`;
}

export async function hydratePostsByIds(
    postIds: string[],
    viewerId: number
): Promise<any[]> {
    if (postIds.length === 0) return [];

    const cached = await Promise.all(
        postIds.map((id) => getCachedPost(cacheKey(id, viewerId)))
    );
    const byId = new Map<string, any>();
    const missingIds: string[] = [];

    postIds.forEach((id, i) => {
        if (cached[i]) {
            byId.set(id, cached[i]);
        } else {
            missingIds.push(id);
        }
    });

    if (missingIds.length > 0) {
        const result = await db.query(HYDRATE_POSTS_BY_IDS_QUERY, [viewerId, missingIds]);
        redactUnavailableOriginals(result.rows);
        for (const row of result.rows) {
            const id = String(row.post_id);
            byId.set(id, row);
            cachePost(cacheKey(id, viewerId), row).catch(() => {});
        }
    }

    // Reassemble in original ZSET order; drop any ID that never hydrated
    // (deleted/hidden/blocked since caching).
    return postIds.map((id) => byId.get(id)).filter(Boolean);
}
