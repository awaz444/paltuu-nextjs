import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";
import { effectiveBucketSql } from "@/lib/feedExperiment";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/social/experiment?days=30
 *
 * Results dashboard for the personalized-feed A/B test. Compares the control arm
 * (current feed) against the treatment arm (personalized feed) on engagement.
 *
 * Metrics per arm (over the last `days`):
 *   users                    — total users in the arm (effective bucket)
 *   active_users             — users with >= 1 engagement action in the window
 *   total_actions            — likes + comments + reposts + saves in the window
 *   actions_per_active_user  — total_actions / active_users (the headline number)
 *   impressions              — personalized-feed posts served in the window
 *   engagement_per_impression— total_actions / impressions
 *
 * NOTE: literal "time spent in app" is not measured — it needs client session
 * tracking we don't collect. Engagement-per-user is the standard feed-test metric.
 */
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") || "30", 10)));
    const bucketExpr = effectiveBucketSql('u');

    // One row per arm: user counts + engagement actions (unioned across the four
    // engagement tables) joined back to each actor's effective bucket.
    const res = await db.query(
      `
      WITH user_arm AS (
        SELECT u.user_id, ${bucketExpr} AS arm
        FROM users u
      ),
      actions AS (
        SELECT user_id, created_at FROM social_likes   WHERE created_at >= NOW() - ($1 || ' days')::interval
        UNION ALL
        SELECT user_id, created_at FROM social_comments WHERE created_at >= NOW() - ($1 || ' days')::interval AND is_deleted = false
        UNION ALL
        SELECT user_id, created_at FROM social_reposts  WHERE created_at >= NOW() - ($1 || ' days')::interval
        UNION ALL
        SELECT user_id, created_at FROM saved_posts     WHERE created_at >= NOW() - ($1 || ' days')::interval
      ),
      action_by_arm AS (
        SELECT ua.arm, COUNT(*) AS total_actions, COUNT(DISTINCT a.user_id) AS active_users
        FROM actions a
        JOIN user_arm ua ON ua.user_id = a.user_id
        GROUP BY ua.arm
      ),
      users_by_arm AS (
        SELECT arm, COUNT(*) AS users FROM user_arm GROUP BY arm
      ),
      impressions_by_arm AS (
        SELECT experiment_bucket AS arm, COUNT(*) AS impressions
        FROM feed_impression_logs
        WHERE created_at >= NOW() - ($1 || ' days')::interval
        GROUP BY experiment_bucket
      )
      SELECT
        arms.arm,
        COALESCE(ub.users, 0)          AS users,
        COALESCE(aba.active_users, 0)  AS active_users,
        COALESCE(aba.total_actions, 0) AS total_actions,
        COALESCE(ib.impressions, 0)    AS impressions
      FROM (SELECT unnest(ARRAY['control','treatment']) AS arm) arms
      LEFT JOIN users_by_arm       ub  ON ub.arm  = arms.arm
      LEFT JOIN action_by_arm      aba ON aba.arm = arms.arm
      LEFT JOIN impressions_by_arm ib  ON ib.arm  = arms.arm
      `,
      [String(days)]
    );

    const arms: Record<string, any> = {};
    for (const r of res.rows) {
      const users = Number(r.users);
      const activeUsers = Number(r.active_users);
      const totalActions = Number(r.total_actions);
      const impressions = Number(r.impressions);
      arms[r.arm] = {
        users,
        active_users: activeUsers,
        total_actions: totalActions,
        actions_per_active_user: activeUsers > 0 ? totalActions / activeUsers : 0,
        impressions,
        engagement_per_impression: impressions > 0 ? totalActions / impressions : 0,
      };
    }

    const control = arms.control ?? { actions_per_active_user: 0 };
    const treatment = arms.treatment ?? { actions_per_active_user: 0 };
    // Relative lift of treatment over control on the headline metric.
    const lift =
      control.actions_per_active_user > 0
        ? (treatment.actions_per_active_user - control.actions_per_active_user) /
          control.actions_per_active_user
        : null;

    return NextResponse.json({
      window_days: days,
      control,
      treatment,
      lift_actions_per_active_user: lift,
    });
  } catch (error) {
    console.error("Admin experiment dashboard GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
