import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/admin/social/pet-photos/:id/moderate
 * Body: { shadow_hidden: boolean }
 *
 * Shadow-hides (or restores) a single pet profile gallery photo. While
 * shadow-hidden the polaroid still appears in its owner's gallery exactly as
 * before — same position, same caption, and counted in photo_count for them —
 * and is absent for every other viewer. The owner is never notified, and the
 * flag is not returned by the public photos endpoint.
 *
 * Nothing to reconcile in Redis here: pet gallery photos aren't cached the way
 * feed posts are, so the next read picks the change up directly.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const adminId = Number.isNaN(parseInt(String(admin.id), 10)) ? null : parseInt(String(admin.id), 10);

  try {
    const photoId = params.id;
    const body = await req.json();

    if (typeof body.shadow_hidden !== "boolean") {
      return NextResponse.json({ error: "shadow_hidden must be a boolean" }, { status: 400 });
    }
    const shadowHidden: boolean = body.shadow_hidden;

    const updated = await db.query(
      `UPDATE pet_profile_photos
         SET is_shadow_hidden = $2
       WHERE photo_id = $1
       RETURNING photo_id, is_shadow_hidden`,
      [photoId, shadowHidden]
    );
    if ((updated.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    await db.query(
      `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
       VALUES ($1, $2, $3, 'successful')`,
      [
        adminId,
        `moderate_pet_photo:${shadowHidden ? "shadow_hidden" : "restored"}`,
        `pet_photo:${photoId}`,
      ]
    );

    return NextResponse.json({ success: true, is_shadow_hidden: updated.rows[0].is_shadow_hidden });
  } catch (error) {
    console.error("Admin moderate pet-photo PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
