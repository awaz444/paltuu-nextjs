import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/social/pet-photos?limit&offset&search&status
 *
 * Browser for pet profile gallery photos ("polaroids"), so an admin can find
 * one and shadow-hide it. There is no user-facing pet-photo moderation
 * surface — the owner is never told and sees no change.
 *
 * status: all | shadow_hidden
 * search: matches pet name, caption, owner name, or owner @username
 */
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const search = searchParams.get("search")?.trim() ?? "";
  const status = searchParams.get("status") ?? "all";

  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let p = 1;

    if (search) {
      conditions.push(
        `(pp.name ILIKE $${p} OR ppp.caption ILIKE $${p} OR u.name ILIKE $${p} OR u.social_username ILIKE $${p})`
      );
      params.push(`%${search}%`);
      p++;
    }
    if (status === "shadow_hidden") {
      conditions.push(`ppp.is_shadow_hidden = true`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [photosResult, countResult] = await Promise.all([
      db.query(
        `SELECT
           ppp.photo_id,
           ppp.pet_profile_id,
           ppp.photo_url,
           ppp.caption,
           ppp.is_shadow_hidden,
           ppp.created_at,
           pp.name              AS pet_name,
           pp.species,
           u.user_id            AS owner_id,
           u.name               AS owner_name,
           u.social_username    AS owner_username
         FROM pet_profile_photos ppp
         JOIN pet_profiles pp ON pp.pet_profile_id = ppp.pet_profile_id
         JOIN users u         ON u.user_id = pp.owner_id
         ${where}
         ORDER BY ppp.created_at DESC
         LIMIT $${p} OFFSET $${p + 1}`,
        [...params, limit, offset]
      ),
      db.query(
        `SELECT COUNT(*)::int AS total
         FROM pet_profile_photos ppp
         JOIN pet_profiles pp ON pp.pet_profile_id = ppp.pet_profile_id
         JOIN users u         ON u.user_id = pp.owner_id
         ${where}`,
        params
      ),
    ]);

    return NextResponse.json({
      photos: photosResult.rows,
      total: countResult.rows[0]?.total ?? 0,
    });
  } catch (error) {
    console.error("Admin pet-photos GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
