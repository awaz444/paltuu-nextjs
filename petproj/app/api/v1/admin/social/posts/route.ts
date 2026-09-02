import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/social/posts?limit&offset&search&status
 * status: all | untagged | quarantined | hidden | shadow_hidden
 *       | pet_sale | pet_sale_review | trigger_warning
 *
 * `pet_sale` is every post carrying the public sale notice, whatever has
 * since been done with it. `pet_sale_review` is the working queue: the ones
 * still fully visible, i.e. flagged (usually automatically, on create) and
 * not yet confirmed or cleared by a human.
 */
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const search = searchParams.get("search")?.trim() ?? "";
  const status = searchParams.get("status") ?? "all";

  try {
    const conditions: string[] = [`COALESCE(sp.is_deleted, false) = false`];
    const params: any[] = [];
    let p = 1;

    if (search) {
      conditions.push(`(sp.content ILIKE $${p} OR u.social_username ILIKE $${p} OR u.name ILIKE $${p})`);
      params.push(`%${search}%`);
      p++;
    }

    if (status === "untagged") {
      conditions.push(`sp.tagging_status = 'untagged'`);
    } else if (status === "quarantined") {
      conditions.push(`sp.moderation_state = 'quarantined'`);
    } else if (status === "hidden") {
      conditions.push(`sp.moderation_state = 'hidden'`);
    } else if (status === "shadow_hidden") {
      conditions.push(`sp.is_shadow_hidden = true`);
    } else if (status === "pet_sale") {
      conditions.push(`sp.content_notice_reason = 'pet_sale'`);
    } else if (status === "trigger_warning") {
      conditions.push(`sp.has_trigger_warning = true`);
    } else if (status === "pet_sale_review") {
      conditions.push(`sp.content_notice_reason = 'pet_sale'`);
      // Untouched since the flag went on: taking the post down (or restoring
      // it) is what closes the review, and both move moderation_state off
      // 'none'. Older rows predate the column's default, hence the IS NULL.
      conditions.push(`(sp.moderation_state IS NULL OR sp.moderation_state = 'none')`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [postsResult, countResult] = await Promise.all([
      db.query(
        `SELECT
           sp.post_id,
           sp.content,
           sp.post_type,
           sp.created_at,
           sp.tagging_status,
           sp.moderation_state,
           sp.is_hidden,
           sp.is_shadow_hidden,
           sp.content_notice_reason,
           sp.has_trigger_warning,
           u.name,
           u.social_username AS username,
           COALESCE(sp.report_count, 0)::int AS report_count,
           COALESCE(sp.report_weighted_score, 0)::float AS report_weighted_score,
           COALESCE(
             json_agg(
               json_build_object('tag_id', ct.tag_id, 'slug', ct.slug, 'label', ct.label, 'role', pct.role)
             ) FILTER (WHERE ct.tag_id IS NOT NULL),
             '[]'
           ) AS tags,
           COALESCE(
             (SELECT json_agg(h ORDER BY h.performed_at DESC)
              FROM (
                SELECT
                  aal.log_id,
                  aal.action_performed AS action,
                  aal.status,
                  aal.date_performed AS performed_at,
                  au.name AS admin_name
                FROM admin_action_logs aal
                LEFT JOIN users au ON au.user_id = aal.admin_id
                WHERE aal.target_entity = 'post:' || sp.post_id
                ORDER BY aal.date_performed DESC
                LIMIT 5
              ) h),
             '[]'::json
           ) AS action_history
         FROM social_posts sp
         LEFT JOIN users u ON u.user_id = sp.user_id
         LEFT JOIN post_content_tags pct ON pct.post_id = sp.post_id
         LEFT JOIN content_tags ct ON ct.tag_id = pct.tag_id
         ${where}
         GROUP BY sp.post_id, u.name, u.social_username
         ORDER BY sp.created_at ${status === "pet_sale_review" ? "ASC" : "DESC"}
         LIMIT $${p} OFFSET $${p + 1}`,
        [...params, limit, offset]
      ),
      db.query(
        `SELECT COUNT(DISTINCT sp.post_id) AS total
         FROM social_posts sp
         LEFT JOIN users u ON u.user_id = sp.user_id
         ${where}`,
        params
      ),
    ]);

    return NextResponse.json({
      posts: postsResult.rows,
      total: parseInt(countResult.rows[0]?.total ?? "0"),
    });
  } catch (error) {
    console.error("Admin posts GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
