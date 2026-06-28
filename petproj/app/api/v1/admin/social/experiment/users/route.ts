import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";
import { effectiveBucketSql } from "@/lib/feedExperiment";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/social/experiment/users?bucket=&q=&days=30&limit=50&offset=0
 *
 * Paginated list of users with their effective A/B arm + engagement count in the
 * window — powers the "who's in which arm / who to move" admin view.
 *   bucket: 'control' | 'treatment' filter (optional)
 *   q:      name / username search (optional)
 */
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const days   = Math.min(365, Math.max(1, parseInt(searchParams.get("days")   || "30", 10)));
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit")  || "50", 10)));
    const offset = Math.max(0,  parseInt(searchParams.get("offset") || "0", 10));
    const bucketFilter = searchParams.get("bucket");
    const q = (searchParams.get("q") || "").trim();

    const bucketExpr = effectiveBucketSql('u');
    const params: any[] = [String(days)];
    const conds: string[] = [];

    if (q) {
      params.push(`%${q}%`);
      conds.push(`(u.name ILIKE $${params.length} OR u.social_username ILIKE $${params.length})`);
    }

    // HAVING on the computed bucket (can't reference the alias in WHERE).
    let havingClause = "";
    if (bucketFilter === 'control' || bucketFilter === 'treatment') {
      params.push(bucketFilter);
      havingClause = `HAVING ${bucketExpr} = $${params.length}`;
    }

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const sql = `
      SELECT
        u.user_id,
        u.name,
        u.social_username,
        ${bucketExpr} AS effective_bucket,
        COALESCE(u.feed_experiment_assigned, false) AS is_overridden,
        (
          (SELECT COUNT(*) FROM social_likes   sl WHERE sl.user_id = u.user_id AND sl.created_at >= NOW() - ($1 || ' days')::interval)
        + (SELECT COUNT(*) FROM social_comments sc WHERE sc.user_id = u.user_id AND sc.is_deleted = false AND sc.created_at >= NOW() - ($1 || ' days')::interval)
        + (SELECT COUNT(*) FROM social_reposts  sr WHERE sr.user_id = u.user_id AND sr.created_at >= NOW() - ($1 || ' days')::interval)
        + (SELECT COUNT(*) FROM saved_posts     sp WHERE sp.user_id = u.user_id AND sp.created_at >= NOW() - ($1 || ' days')::interval)
        ) AS engagement_count
      FROM users u
      ${conds.length ? `WHERE ${conds.join(' AND ')}` : ''}
      ${havingClause ? `GROUP BY u.user_id ${havingClause}` : ''}
      ORDER BY engagement_count DESC, u.user_id ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const res = await db.query(sql, params);
    const users = res.rows.map((r) => ({
      user_id: r.user_id,
      name: r.name,
      social_username: r.social_username,
      effective_bucket: r.effective_bucket,
      is_overridden: r.is_overridden,
      engagement_count: Number(r.engagement_count),
    }));

    return NextResponse.json({ users, limit, offset, window_days: days });
  } catch (error) {
    console.error("Admin experiment users GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
