import type { Pool, PoolClient } from "pg";

/**
 * Resolve a post id that may point at a hollow *plain* repost entry
 * ("XYZ reposted ABC" with no caption/media of its own) to the real,
 * interactable root post. Plain reposts carry no genuine likes/comments —
 * every like, comment, and stat belongs on the original — so any action
 * endpoint accepting a post id from the client must dereference through
 * this first. Quote reposts (content IS NOT NULL) are left as-is: they are
 * standalone posts with their own body and are legitimately interactable.
 *
 * Walks the original_post_id chain to the root (capped at depth 10) in case
 * of (currently impossible, but defensively handled) chained plain reposts.
 */
export async function resolveRepostTarget(
    db: Pool | PoolClient,
    postId: string | number
): Promise<{ postId: string; authorId: number; isDeleted: boolean; isShadowHidden: boolean } | null> {
    const resolved = await db.query(
        `WITH RECURSIVE chain AS (
            SELECT post_id, user_id, is_repost, original_post_id, content, is_deleted, is_shadow_hidden, 0 AS depth
            FROM social_posts WHERE post_id = $1
          UNION ALL
            SELECT p.post_id, p.user_id, p.is_repost, p.original_post_id, p.content, p.is_deleted, p.is_shadow_hidden, c.depth + 1
            FROM social_posts p
            JOIN chain c ON p.post_id = c.original_post_id
            WHERE c.is_repost = true AND c.content IS NULL
              AND c.original_post_id IS NOT NULL AND c.depth < 10
        )
        SELECT post_id, user_id, is_deleted, is_shadow_hidden FROM chain ORDER BY depth DESC LIMIT 1`,
        [postId]
    );
    if (resolved.rowCount === 0) return null;
    const row = resolved.rows[0];
    return {
        postId: String(row.post_id),
        authorId: row.user_id,
        isDeleted: row.is_deleted,
        isShadowHidden: row.is_shadow_hidden === true,
    };
}
