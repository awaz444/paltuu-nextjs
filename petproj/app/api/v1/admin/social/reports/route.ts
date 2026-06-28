import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/social/reports?status=pending&sort=priority&limit=&offset=
 * Post reports with weighted score + brigading flags + reporter trust.
 * Burst-flagged / preemptive-block posts pinned first, then by weighted score.
 */
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50", 10));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    const result = await db.query(`
      SELECT
        r.report_id,
        r.target_id            AS post_id,
        r.reason_code,
        r.report_weight,
        r.additional_note,
        r.created_at,
        LEFT(COALESCE(p.content, ''), 200) AS post_preview,
        p.report_weighted_score AS post_weighted_score,
        p.report_count          AS post_report_count,
        p.moderation_state,
        p.suspicious_burst_at,
        p.author_block_after_report,
        u.user_id              AS reporter_user_id,
        u.name                 AS reporter_name,
        u.reporter_trust,
        u.trust_ceiling,
        u.lifetime_dismissals
      FROM reports r
      JOIN social_posts p ON p.post_id = r.target_id
      JOIN users u        ON u.user_id = r.reporter_id
      WHERE r.target_type = 'post' AND r.status = $1
      ORDER BY
        (p.suspicious_burst_at IS NOT NULL OR COALESCE(p.author_block_after_report, false)) DESC,
        p.report_weighted_score DESC NULLS LAST,
        r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [status, limit, offset]);

    const reports = result.rows.map((row) => ({
      report_id: row.report_id,
      post_id: row.post_id,
      reason_code: row.reason_code,
      report_weight: row.report_weight,
      additional_note: row.additional_note,
      created_at: row.created_at,
      post_preview: row.post_preview,
      post_weighted_score: row.post_weighted_score,
      post_report_count: row.post_report_count,
      moderation_state: row.moderation_state,
      suspicious_burst_at: row.suspicious_burst_at,
      author_block_after_report: row.author_block_after_report,
      reporter: {
        user_id: row.reporter_user_id,
        name: row.reporter_name,
        reporter_trust: row.reporter_trust,
        trust_ceiling: row.trust_ceiling,
        lifetime_dismissals: row.lifetime_dismissals,
      },
    }));

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Admin reports GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
