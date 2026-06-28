import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/social/tagging-queue?limit=20&offset=0&filter=all|media|text|sla_breach
 * Untagged posts awaiting admin tags, oldest first.
 */
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));
    const filter = searchParams.get("filter") || "all";

    let filterClause = "";
    if (filter === "media") {
      filterClause = "AND EXISTS (SELECT 1 FROM social_post_media m WHERE m.post_id = p.post_id)";
    } else if (filter === "text") {
      filterClause = "AND NOT EXISTS (SELECT 1 FROM social_post_media m WHERE m.post_id = p.post_id)";
    } else if (filter === "sla_breach") {
      filterClause = "AND p.created_at < NOW() - INTERVAL '4 hours'";
    }

    const result = await db.query(`
      SELECT
        p.post_id, p.content, p.post_type, p.created_at, p.report_count,
        EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600.0 AS hours_untagged,
        COALESCE(
          (SELECT json_agg(json_build_object('url', m.url, 'media_type', m.media_type) ORDER BY m.ordering)
           FROM social_post_media m WHERE m.post_id = p.post_id),
          '[]'::json
        ) AS media,
        COALESCE(
          (SELECT json_agg(h.tag)
           FROM post_hashtags ph JOIN hashtags h ON h.hashtag_id = ph.hashtag_id
           WHERE ph.post_id = p.post_id),
          '[]'::json
        ) AS hashtags
      FROM social_posts p
      WHERE p.tagging_status = 'untagged' AND p.is_deleted = false
      ${filterClause}
      ORDER BY p.created_at ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const totalRes = await db.query(`
      SELECT COUNT(*)::int AS n
      FROM social_posts p
      WHERE p.tagging_status = 'untagged' AND p.is_deleted = false
    `);

    return NextResponse.json({
      posts: result.rows,
      total_untagged: totalRes.rows[0]?.n ?? 0,
    });
  } catch (error) {
    console.error("Admin tagging-queue GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
