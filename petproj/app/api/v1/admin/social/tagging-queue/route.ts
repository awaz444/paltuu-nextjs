import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/social/tagging-queue?limit=20&offset=0&filter=recent|all|media|text|sla_breach
 * Untagged posts awaiting admin tags, oldest first.
 *
 * `recent` (the default) hides posts older than the 72h engagement-backfill
 * window — past that point tagging recovers no historical interest signal
 * (see the tagging guide), so they only clutter the working queue. `all` is
 * the escape hatch that still lists them. `media` / `text` / `sla_breach`
 * are likewise scoped to the recoverable window.
 */
const RECOVERABLE_WINDOW = "p.created_at >= NOW() - INTERVAL '72 hours'";

export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));
    const filter = searchParams.get("filter") || "recent";

    let filterClause = "";
    if (filter === "all") {
      // Everything, engagement-lost posts included.
      filterClause = "";
    } else if (filter === "media") {
      filterClause = `AND ${RECOVERABLE_WINDOW} AND EXISTS (SELECT 1 FROM social_post_media m WHERE m.post_id = p.post_id)`;
    } else if (filter === "text") {
      filterClause = `AND ${RECOVERABLE_WINDOW} AND NOT EXISTS (SELECT 1 FROM social_post_media m WHERE m.post_id = p.post_id)`;
    } else if (filter === "sla_breach") {
      // Overdue but still recoverable — past the 4h SLA, inside the 72h window.
      filterClause = `AND ${RECOVERABLE_WINDOW} AND p.created_at < NOW() - INTERVAL '4 hours'`;
    } else {
      // "recent" (default): still inside the 72h engagement-backfill window.
      filterClause = `AND ${RECOVERABLE_WINDOW}`;
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
      SELECT
        COUNT(*)::int AS total_untagged,
        COUNT(*) FILTER (WHERE ${RECOVERABLE_WINDOW})::int AS total_recoverable
      FROM social_posts p
      WHERE p.tagging_status = 'untagged' AND p.is_deleted = false
    `);

    return NextResponse.json({
      posts: result.rows,
      total_untagged: totalRes.rows[0]?.total_untagged ?? 0,
      total_recoverable: totalRes.rows[0]?.total_recoverable ?? 0,
    });
  } catch (error) {
    console.error("Admin tagging-queue GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
