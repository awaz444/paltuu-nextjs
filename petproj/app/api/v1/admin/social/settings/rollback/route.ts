import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";

export const dynamic = "force-dynamic";

const SETTINGS_KEY = 'social_feed_settings';

/**
 * POST /api/v1/admin/social/settings/rollback
 * Body: { version_id: number }
 * Restores a previously snapshotted settings value (snapshotting the current one first).
 */
export async function POST(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const adminId = Number.isNaN(parseInt(String(admin.id), 10)) ? null : parseInt(String(admin.id), 10);

  try {
    const body = await req.json();
    const versionId = parseInt(String(body.version_id), 10);
    if (Number.isNaN(versionId)) {
      return NextResponse.json({ error: "version_id is required" }, { status: 400 });
    }

    const versionRes = await db.query(
      `SELECT settings_value FROM app_settings_versions WHERE version_id = $1 AND settings_key = $2`,
      [versionId, SETTINGS_KEY]
    );
    if (versionRes.rowCount === 0) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }
    const restored = versionRes.rows[0].settings_value;
    const restoredJson = typeof restored === 'string' ? restored : JSON.stringify(restored);

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Snapshot the current value before overwriting.
      const currentRes = await client.query(
        `SELECT setting_value FROM app_settings WHERE setting_key = $1`,
        [SETTINGS_KEY]
      );
      if (currentRes.rowCount && currentRes.rows[0].setting_value != null) {
        const cur = currentRes.rows[0].setting_value;
        await client.query(
          `INSERT INTO app_settings_versions (settings_key, settings_value, created_by)
           VALUES ($1, $2::jsonb, $3)`,
          [SETTINGS_KEY, typeof cur === 'string' ? cur : JSON.stringify(cur), adminId]
        );
      }

      await client.query(
        `INSERT INTO app_settings (setting_key, setting_value, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2::jsonb, updated_at = NOW()`,
        [SETTINGS_KEY, restoredJson]
      );

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      client.release();
      throw e;
    }
    client.release();

    const settings = typeof restored === 'string' ? JSON.parse(restored) : restored;
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Admin settings rollback POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
