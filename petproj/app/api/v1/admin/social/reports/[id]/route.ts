import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";
import { getReportSettings, recomputeTrustCeiling } from "@/lib/reportScoring";

export const dynamic = "force-dynamic";

const VALID_ACTIONS = ['dismiss', 'confirm_hide', 'warn_reporter'];

/**
 * PATCH /api/v1/admin/social/reports/:id
 * Body: { action: 'dismiss' | 'confirm_hide' | 'warn_reporter' }
 * Implements the trust math from plan §7.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const adminId = Number.isNaN(parseInt(String(admin.id), 10)) ? null : parseInt(String(admin.id), 10);

  try {
    const reportId = params.id;
    const body = await req.json();
    const action: string = body.action;
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: `action must be one of ${VALID_ACTIONS.join(', ')}` }, { status: 400 });
    }

    const reportRes = await db.query(
      `SELECT report_id, target_id, reporter_id FROM reports WHERE report_id = $1 AND target_type = 'post'`,
      [reportId]
    );
    if (reportRes.rowCount === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    const { target_id: postId, reporter_id: reporterId } = reportRes.rows[0];

    const settings = await getReportSettings();

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      if (action === 'dismiss') {
        const immunityHours = settings.report_immunity_hours ?? 48;

        await client.query(
          `UPDATE reports SET status = 'dismissed', reviewed_at = NOW() WHERE report_id = $1`,
          [reportId]
        );
        await client.query(
          `UPDATE social_posts
             SET moderation_state = 'none',
                 is_hidden = false,
                 report_weighted_score = 0,
                 report_immunity_until = NOW() + make_interval(hours => $2)
           WHERE post_id = $1`,
          [postId, immunityHours]
        );

        // Decay trust, bump dismissal counters, recompute ceiling.
        const reporterUpd = await client.query(
          `UPDATE users
             SET reporter_trust = GREATEST(0.25, COALESCE(reporter_trust, 1.0) * 0.95),
                 lifetime_dismissals = COALESCE(lifetime_dismissals, 0) + 1,
                 last_dismissal_at = NOW()
           WHERE user_id = $1
           RETURNING lifetime_dismissals, last_dismissal_at`,
          [reporterId]
        );
        const { lifetime_dismissals, last_dismissal_at } = reporterUpd.rows[0];
        const ceiling = recomputeTrustCeiling(lifetime_dismissals, last_dismissal_at ? new Date(last_dismissal_at) : new Date());
        await client.query(
          `UPDATE users SET trust_ceiling = $2, reporter_trust = LEAST(reporter_trust, $2) WHERE user_id = $1`,
          [reporterId, ceiling]
        );

        await client.query(
          `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
           VALUES ($1, 'resolve_report', $2, 'dismissed')`,
          [adminId, `post:${postId}`]
        );
      } else if (action === 'confirm_hide') {
        await client.query(
          `UPDATE reports SET status = 'actioned', reviewed_at = NOW() WHERE report_id = $1`,
          [reportId]
        );
        await client.query(
          `UPDATE social_posts SET moderation_state = 'hidden', is_hidden = true WHERE post_id = $1`,
          [postId]
        );
        // Boost reporter trust, capped at their ceiling.
        await client.query(
          `UPDATE users
             SET reporter_trust = LEAST(COALESCE(trust_ceiling, 1.0), COALESCE(reporter_trust, 1.0) * 1.08 + 0.03)
           WHERE user_id = $1`,
          [reporterId]
        );
        await client.query(
          `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
           VALUES ($1, 'hide_post', $2, 'actioned')`,
          [adminId, `post:${postId}`]
        );
      } else {
        // warn_reporter — mark reviewed, log only.
        await client.query(
          `UPDATE reports SET status = 'reviewed', reviewed_at = NOW() WHERE report_id = $1`,
          [reportId]
        );
        await client.query(
          `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
           VALUES ($1, 'warn_reporter', $2, 'reviewed')`,
          [adminId, `user:${reporterId}`]
        );
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      client.release();
      throw e;
    }
    client.release();

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error("Admin report-action PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
