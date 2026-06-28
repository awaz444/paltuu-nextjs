import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";

export const dynamic = "force-dynamic";

const SETTINGS_KEY = "social_feed_settings";

/**
 * GET /api/v1/admin/social/settings/versions?limit=10
 * Returns the last N snapshots of social feed settings (newest first).
 */
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(20, parseInt(searchParams.get("limit") || "10", 10));

    const res = await db.query(
      `SELECT
         v.version_id,
         v.created_at,
         v.settings_value,
         u.name AS changed_by_name
       FROM app_settings_versions v
       LEFT JOIN users u ON u.user_id = v.created_by
       WHERE v.settings_key = $1
       ORDER BY v.created_at DESC
       LIMIT $2`,
      [SETTINGS_KEY, limit]
    );

    return NextResponse.json({ versions: res.rows });
  } catch (error) {
    console.error("Settings versions GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
