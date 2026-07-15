import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";
import { backfillInterestForPost } from "@/lib/interestScoring";

export const dynamic = "force-dynamic";

interface TagInput {
  tag_id: number;
  role: 'primary' | 'secondary';
}

/**
 * POST /api/v1/admin/social/posts/:id/tags
 * Body: { tags: [{ tag_id, role: 'primary' | 'secondary' }] }
 * Replaces the post's tags, marks it tagged, then backfills queued interest events.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const adminId = Number.isNaN(parseInt(String(admin.id), 10)) ? null : parseInt(String(admin.id), 10);

  try {
    const postId = params.id;
    const body = await req.json();
    const tags: TagInput[] = Array.isArray(body.tags) ? body.tags : [];

    // Validate roles + primary count
    for (const t of tags) {
      if (!t || typeof t.tag_id !== 'number' || (t.role !== 'primary' && t.role !== 'secondary')) {
        return NextResponse.json({ error: "Each tag needs a numeric tag_id and role 'primary'|'secondary'" }, { status: 400 });
      }
    }
    const primaries = tags.filter((t) => t.role === 'primary');
    if (primaries.length < 1) {
      return NextResponse.json({ error: "At least one primary tag is required" }, { status: 400 });
    }
    if (primaries.length > 3) {
      return NextResponse.json({ error: "At most 3 primary tags are allowed" }, { status: 400 });
    }

    // Confirm post exists
    const postCheck = await db.query(`SELECT post_id FROM social_posts WHERE post_id = $1`, [postId]);
    if (postCheck.rowCount === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Confirm all tag_ids exist
    const tagIds = tags.map((t) => t.tag_id);
    const tagsExist = await db.query(`SELECT tag_id FROM content_tags WHERE tag_id = ANY($1::int[])`, [tagIds]);
    if ((tagsExist.rowCount ?? 0) !== new Set(tagIds).size) {
      return NextResponse.json({ error: "One or more tag_ids do not exist" }, { status: 400 });
    }

    const primaryTagIds = primaries.map((t) => t.tag_id);
    const firstPrimary = primaryTagIds[0];

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Replace existing tags (allows re-tagging)
      await client.query(`DELETE FROM post_content_tags WHERE post_id = $1`, [postId]);
      for (const t of tags) {
        await client.query(
          `INSERT INTO post_content_tags (post_id, tag_id, role, tagged_by, source)
           VALUES ($1, $2, $3, $4, 'admin')`,
          [postId, t.tag_id, t.role, adminId]
        );
      }

      await client.query(
        `UPDATE social_posts
           SET tagging_status = 'tagged',
               primary_tag_id = $2,
               tagged_at = NOW(),
               tagged_by = $3
         WHERE post_id = $1`,
        [postId, firstPrimary, adminId]
      );

      await client.query(
        `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
         VALUES ($1, 'tag_post', $2, 'successful')`,
        [adminId, `post:${postId}`]
      );

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      client.release();
      throw e;
    }
    client.release();

    // Replay queued engagement now that the post is tagged (own connection; post-commit).
    await backfillInterestForPost(postId, primaryTagIds);

    return NextResponse.json({ success: true, post_id: postId, primary_tag_ids: primaryTagIds });
  } catch (error) {
    console.error("Admin apply-tags POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
