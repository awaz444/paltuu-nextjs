import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";
import { removePostFromCaches } from "@/lib/redis";
import { archiveDeletedPost } from "@/lib/activityArchive";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/admin/social/posts/:id
 * Admin hard takedown: same soft-delete the author's own delete performs
 * (archived to deleted_social_posts, is_deleted = true, hashtag/post_count
 * upkeep, dropped from feed caches) — the difference is only that any admin
 * can invoke it on any post, and it's logged to admin_action_logs.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const adminId = Number.isNaN(parseInt(String(admin.id), 10)) ? null : parseInt(String(admin.id), 10);

  const postId = params.id;

  try {
    const post = await db.query(
      "SELECT user_id FROM social_posts WHERE post_id = $1 AND is_deleted = false",
      [postId]
    );
    if (post.rowCount === 0) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    const authorId: number = post.rows[0].user_id;

    const client = await db.connect();
    try {
      await archiveDeletedPost(client, postId, authorId);

      await client.query('BEGIN');
      await client.query(`
        UPDATE hashtags h
        SET post_count = GREATEST(0, h.post_count - 1)
        FROM post_hashtags ph
        WHERE ph.hashtag_id = h.hashtag_id
          AND ph.post_id = $1
      `, [postId]);

      await client.query(
        "UPDATE social_posts SET is_deleted = true, updated_at = NOW() WHERE post_id = $1",
        [postId]
      );
      await client.query(
        "UPDATE users SET post_count = GREATEST(0, post_count - 1) WHERE user_id = $1",
        [authorId]
      );
      await client.query(
        `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
         VALUES ($1, 'delete_post', $2, 'successful')`,
        [adminId, `post:${postId}`]
      );
      await client.query('COMMIT');

      removePostFromCaches(postId, authorId, db).catch(() => {});
      return NextResponse.json({ deleted: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Admin post DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
