import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/content-tags
 * Active tags grouped by category, for the RN onboarding interest picker.
 * Response: { categories: { species: Tag[], topic: Tag[], content_type: Tag[], mood: Tag[] } }
 *   Tag = { tag_id, slug, label }
 */
export async function GET(_req: NextRequest) {
  try {
    const res = await db.query(`
      SELECT tag_id, slug, label, category
      FROM content_tags
      WHERE is_active = true
      ORDER BY category, sort_order, label
    `);

    const categories: Record<string, Array<{ tag_id: number; slug: string; label: string }>> = {
      species: [], topic: [], content_type: [], mood: [],
    };
    for (const row of res.rows) {
      (categories[row.category] ??= []).push({
        tag_id: row.tag_id,
        slug: row.slug,
        label: row.label,
      });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Social content-tags GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
