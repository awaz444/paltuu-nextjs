import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";
import { DEFAULT_SETTINGS } from "@/lib/reportScoring";

export const dynamic = "force-dynamic";

const SETTINGS_KEY = 'social_feed_settings';
const FEED_WEIGHT_KEYS = ['feed_weight_base', 'feed_weight_affinity'];
const VALID_KEYS = Object.keys(DEFAULT_SETTINGS);

async function loadSettings(): Promise<Record<string, any>> {
  const res = await db.query(`SELECT setting_value FROM app_settings WHERE setting_key = $1`, [SETTINGS_KEY]);
  const stored = res.rows[0]?.setting_value;
  if (!stored) return { ...DEFAULT_SETTINGS };
  const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
  return { ...DEFAULT_SETTINGS, ...parsed };
}

/**
 * GET /api/v1/admin/social/settings
 */
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const settings = await loadSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Admin settings GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/admin/social/settings
 * Body: { key: string, value: any }
 * Validates feed-weight sum, snapshots the prior value, then updates.
 */
export async function PATCH(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const adminId = Number.isNaN(parseInt(String(admin.id), 10)) ? null : parseInt(String(admin.id), 10);

  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || !VALID_KEYS.includes(key)) {
      return NextResponse.json({ error: `key must be one of: ${VALID_KEYS.join(', ')}` }, { status: 400 });
    }
    if (value === undefined) {
      return NextResponse.json({ error: "value is required" }, { status: 400 });
    }

    const current = await loadSettings();
    const next: Record<string, any> = { ...current, [key]: value };

    // If touching a feed weight, the base + affinity weights must sum to ~1.0.
    if (FEED_WEIGHT_KEYS.includes(key)) {
      const sum = Number(next.feed_weight_base) + Number(next.feed_weight_affinity);
      if (!(Math.abs(sum - 1.0) <= 0.01)) {
        return NextResponse.json(
          { error: `feed_weight_base + feed_weight_affinity must equal 1.0 (±0.01); got ${sum}` },
          { status: 400 }
        );
      }
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Snapshot the prior full value for rollback.
      await client.query(
        `INSERT INTO app_settings_versions (settings_key, settings_value, created_by)
         VALUES ($1, $2::jsonb, $3)`,
        [SETTINGS_KEY, JSON.stringify(current), adminId]
      );

      await client.query(
        `INSERT INTO app_settings (setting_key, setting_value, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2::jsonb, updated_at = NOW()`,
        [SETTINGS_KEY, JSON.stringify(next)]
      );

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      client.release();
      throw e;
    }
    client.release();

    return NextResponse.json({ settings: next });
  } catch (error) {
    console.error("Admin settings PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
