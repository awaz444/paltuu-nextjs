import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { emitRepost, emitNotification } from "@/utils/realtimeEmitter";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import { SocialNotifications } from "@/lib/notifications";
import { assertNotBlocked } from "@/lib/moderation";
import { recordEngagementEvent } from "@/lib/interestScoring";
import { resolveRepostTarget } from "@/lib/reposts";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/social/posts/[id]/repost
 * Repost a post (with optional caption). Idempotent — ignores duplicate reposts.
 *
 * Body: { caption?: string }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const limited = await rateLimit(req, LIMITS.REPOST);
        if (limited) return limited;

        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const targetPostId = params.id;
        const body = await req.json().catch(() => ({}));
        // A quick (plain) repost carries no content → stored as NULL. A quote —
        // whether it has text or only media — always stores a non-null content
        // ('' for media-only), which is what distinguishes a hollow plain repost
        // (content IS NULL) from a standalone quote everywhere below.
        // Legacy clients may still send `caption`; honour it as a fallback.
        const content = body.content !== undefined ? body.content
            : (body.caption !== undefined ? body.caption : null);
        const media = Array.isArray(body.media) ? body.media : [];
        const petProfileTags = Array.isArray(body.pet_profile_tags) ? body.pet_profile_tags : [];

        // 1. Resolve the true original. If the target is itself a plain repost
        //    ("XYZ reposted ABC"), reposting must target ABC's real post — never
        //    the repost entry, which carries no media/content and would surface
        //    as a blank repost. Only plain reposts (content IS NULL) are
        //    dereferenced; quotes carry their own body/media and are standalone
        //    posts to repost as-is.
        const resolved = await resolveRepostTarget(db, targetPostId);
        if (!resolved || resolved.isDeleted) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        const originalPostId = resolved.postId;
        const originalAuthorId = resolved.authorId;

        // 2. Check if already reposted
        const existing = await db.query(
            "SELECT repost_id FROM social_reposts WHERE post_id = $1 AND user_id = $2",
            [originalPostId, userId]
        );
        if ((existing.rowCount ?? 0) > 0) {
            return NextResponse.json({ reposted: true, message: "Already reposted" });
        }

        // 3. Ensure no blocking relationship exists
        await assertNotBlocked(userId, originalAuthorId);

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            // 3. Record the repost relationship
            await client.query(
                "INSERT INTO social_reposts (post_id, user_id, caption) VALUES ($1, $2, $3)",
                [originalPostId, userId, content]
            );

            // 4. Create a new post entry (the repost in feed)
            const repostEntry = await client.query(`
                INSERT INTO social_posts
                    (user_id, post_type, content, original_post_id, is_repost)
                VALUES ($1, 'repost', $2, $3, true)
                RETURNING *
            `, [userId, content, originalPostId]);
            const repostPostId = repostEntry.rows[0].post_id;

            // 4a. Attach any media the quote carries (images/videos) to the
            //     new repost post, mirroring create-post's media handling.
            const insertedMedia: any[] = [];
            for (let i = 0; i < media.length; i++) {
                const m = media[i];
                const videoStatus = m.media_type === 'video' ? 'pending' : 'ready';
                const mediaRes = await client.query(
                    `INSERT INTO social_post_media
                         (post_id, media_type, url, thumbnail_url, ordering, video_status)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     RETURNING media_id, media_type, url, thumbnail_url, ordering, video_status, hls_url`,
                    [repostPostId, m.media_type, m.url, m.thumbnail_url || null, i, videoStatus]
                );
                insertedMedia.push(mediaRes.rows[0]);
            }

            // 4b. Tag the quoting user's own pet profiles.
            if (petProfileTags.length > 0) {
                const tagIds = petProfileTags
                    .map((id: any) => parseInt(String(id), 10))
                    .filter((id: number) => !isNaN(id));
                if (tagIds.length > 0) {
                    const ownerCheck = await client.query(
                        `SELECT COUNT(*) FROM pet_profiles
                         WHERE pet_profile_id = ANY($1::int[]) AND owner_id = $2`,
                        [tagIds, userId]
                    );
                    if (parseInt(ownerCheck.rows[0].count, 10) !== tagIds.length) {
                        throw new Error('One or more tagged pet profiles do not belong to you');
                    }
                    for (const profileId of tagIds) {
                        await client.query(
                            `INSERT INTO post_pet_tags (post_id, pet_profile_id)
                             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                            [repostPostId, profileId]
                        );
                    }
                }
            }

            // 5. Update repost_count on original
            await client.query(
                "UPDATE social_posts SET repost_count = repost_count + 1 WHERE post_id = $1",
                [originalPostId]
            );

            // 6. Update user post_count
            await client.query(
                "UPDATE users SET post_count = post_count + 1 WHERE user_id = $1",
                [userId]
            );

            // 7. Create notification for original author (if not reposting own post)
            if (originalAuthorId !== userId) {
                // Fetch reposter and post details
                const [reposterRes, postImageRes] = await Promise.all([
                    client.query(`SELECT name, profile_image_url FROM users WHERE user_id = $1`, [userId]),
                    client.query(`SELECT (SELECT url FROM social_post_media WHERE post_id = $1 LIMIT 1) as image_url`, [originalPostId])
                ]);
                const reposter = reposterRes.rows[0];
                const postImage = postImageRes.rows[0]?.image_url;

                SocialNotifications.onPostReposted(
                    originalAuthorId,
                    userId,
                    parseInt(originalPostId),
                    reposter?.name || 'User',
                    postImage
                ).catch(() => {});
            }

            await client.query('COMMIT');

            // Real-time: push repost count update to post viewers
            const updatedPost = await client.query(
                "SELECT repost_count FROM social_posts WHERE post_id = $1",
                [originalPostId]
            );
            emitRepost(originalPostId, userId, updatedPost.rows[0]?.repost_count ?? 0).catch(() => {});

            // Fire-and-forget interest scoring against the ORIGINAL post's tags
            recordEngagementEvent(userId, originalPostId, 'repost').catch(() => {});

            // Real-time: push notification to original author
            if (originalAuthorId !== userId) {
                emitNotification(originalAuthorId, {
                    type: 'social_repost',
                    post_id: originalPostId,
                    actor_id: userId,
                }).catch(() => {});
            }

            return NextResponse.json(
                { reposted: true, post: { ...repostEntry.rows[0], media: insertedMedia } },
                { status: 201 }
            );

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error: any) {
        if (error.message === 'BLOCKED') {
            return NextResponse.json({ error: "BLOCKED" }, { status: 403 });
        }
        console.error("V1 Social Repost POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * DELETE /api/v1/social/posts/[id]/repost
 * Undo a repost
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        // Resolve the true original (mirror of POST) so undoing from a repost
        // card removes the repost of the underlying original, not the repost entry.
        const resolved = await resolveRepostTarget(db, params.id);
        const originalPostId = resolved ? resolved.postId : params.id;

        const existing = await db.query(
            "SELECT repost_id FROM social_reposts WHERE post_id = $1 AND user_id = $2",
            [originalPostId, userId]
        );
        if ((existing.rowCount ?? 0) === 0) {
            return NextResponse.json({ reposted: false, message: "No repost found" });
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            // Remove repost record
            await client.query(
                "DELETE FROM social_reposts WHERE post_id = $1 AND user_id = $2",
                [originalPostId, userId]
            );

            // Soft-delete the repost post entry
            await client.query(`
                UPDATE social_posts
                SET is_deleted = true
                WHERE original_post_id = $1 AND user_id = $2 AND is_repost = true
            `, [originalPostId, userId]);

            // Decrement counts
            await client.query(
                "UPDATE social_posts SET repost_count = GREATEST(0, repost_count - 1) WHERE post_id = $1",
                [originalPostId]
            );
            await client.query(
                "UPDATE users SET post_count = GREATEST(0, post_count - 1) WHERE user_id = $1",
                [userId]
            );

            await client.query('COMMIT');
            return NextResponse.json({ reposted: false });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error("V1 Social Repost DELETE error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
