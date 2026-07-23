import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";

export const dynamic = "force-dynamic";

const ALLOWED_CATEGORIES = ['species', 'topic', 'content_type', 'mood'];

function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * GET /api/v1/admin/social/content-tags
 * All tags (active + inactive) grouped by category, for the taxonomy manager.
 */
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const res = await db.query(`
      SELECT tag_id, slug, label, category, parent_tag_id,
             default_weight, keyword_aliases, is_active, sort_order, description
      FROM content_tags
      ORDER BY category, sort_order, label
    `);

    const categories: Record<string, any[]> = {
      species: [], topic: [], content_type: [], mood: [],
    };
    for (const tag of res.rows) {
      (categories[tag.category] ??= []).push(tag);
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Admin content-tags GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/v1/admin/social/content-tags
 * Body: { label, category, slug?, keyword_aliases? }
 */
export async function POST(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { label, category } = body;
    const keyword_aliases: string[] = Array.isArray(body.keyword_aliases) ? body.keyword_aliases : [];
    const description: string | null = typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null;

    if (!label || !category) {
      return NextResponse.json({ error: "label and category are required" }, { status: 400 });
    }
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `category must be one of ${ALLOWED_CATEGORIES.join(', ')}` }, { status: 400 });
    }

    const slug = body.slug ? slugify(body.slug) : slugify(label);
    if (!slug) {
      return NextResponse.json({ error: "Could not derive a valid slug" }, { status: 400 });
    }

    const existing = await db.query(`SELECT tag_id FROM content_tags WHERE slug = $1`, [slug]);
    if ((existing.rowCount ?? 0) > 0) {
      return NextResponse.json({ error: "A tag with this slug already exists" }, { status: 409 });
    }

    const inserted = await db.query(
      `INSERT INTO content_tags (slug, label, category, keyword_aliases, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING tag_id, slug, label, category, parent_tag_id, default_weight, keyword_aliases, is_active, sort_order, description`,
      [slug, label, category, keyword_aliases, description]
    );

    return NextResponse.json(inserted.rows[0], { status: 201 });
  } catch (error) {
    console.error("Admin content-tags POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
