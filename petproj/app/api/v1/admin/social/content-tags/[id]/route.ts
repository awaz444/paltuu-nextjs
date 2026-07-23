import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/admin/social/content-tags/:id
 * Body (any subset): { label, keyword_aliases, default_weight, is_active, sort_order }
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const tagId = parseInt(params.id, 10);
    if (Number.isNaN(tagId)) return NextResponse.json({ error: "Invalid tag id" }, { status: 400 });

    const body = await req.json();
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (body.label !== undefined) { fields.push(`label = $${i++}`); values.push(body.label); }
    if (body.keyword_aliases !== undefined) {
      fields.push(`keyword_aliases = $${i++}`);
      values.push(Array.isArray(body.keyword_aliases) ? body.keyword_aliases : []);
    }
    if (body.default_weight !== undefined) { fields.push(`default_weight = $${i++}`); values.push(Number(body.default_weight)); }
    if (body.is_active !== undefined) { fields.push(`is_active = $${i++}`); values.push(Boolean(body.is_active)); }
    if (body.sort_order !== undefined) { fields.push(`sort_order = $${i++}`); values.push(parseInt(body.sort_order, 10)); }
    if (body.description !== undefined) {
      fields.push(`description = $${i++}`);
      values.push(typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    values.push(tagId);
    const updated = await db.query(
      `UPDATE content_tags SET ${fields.join(', ')} WHERE tag_id = $${i}
       RETURNING tag_id, slug, label, category, parent_tag_id, default_weight, keyword_aliases, is_active, sort_order, description`,
      values
    );

    if ((updated.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json(updated.rows[0]);
  } catch (error) {
    console.error("Admin content-tags PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
