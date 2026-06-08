import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { calculateAge } from "@/utils/age.util";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/users/:id/pet-profiles
 * Get all personal pet profiles for a given user.
 * Auth optional. Returns 403 if owner is private and requester is not a follower.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const viewerIdRaw = await getUserIdFromRequest(req);
        const viewerId    = viewerIdRaw ? parseInt(String(viewerIdRaw), 10) : 0;
        const targetId    = parseInt(params.id, 10);

        if (isNaN(targetId)) {
            return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
        }

        // ── Privacy check on the owner ────────────────────────────────────────
        const userRes = await db.query(
            `SELECT user_id, is_private,
                    EXISTS(
                        SELECT 1 FROM social_follows f
                        WHERE f.follower_id = $2 AND f.following_id = u.user_id
                    ) AS viewer_is_following
             FROM users u
             WHERE u.user_id = $1`,
            [targetId, viewerId]
        );

        if (userRes.rowCount === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const owner     = userRes.rows[0];
        const isOwner   = viewerId !== 0 && viewerId === targetId;
        const isPrivate = owner.is_private && !isOwner && !owner.viewer_is_following;

        if (isPrivate) {
            return NextResponse.json({ error: "This user's profile is private" }, { status: 403 });
        }

        // ── Fetch pet profiles ────────────────────────────────────────────────
        const result = await db.query(
            `SELECT
                pp.*,
                (SELECT COUNT(*) FROM pet_profile_photos ppp WHERE ppp.pet_profile_id = pp.pet_profile_id)::int AS photo_count,
                (SELECT COUNT(*) FROM post_pet_tags ppt WHERE ppt.pet_profile_id = pp.pet_profile_id)::int       AS tagged_post_count
             FROM pet_profiles pp
             WHERE pp.owner_id = $1
             ORDER BY pp.created_at ASC`,
            [targetId]
        );

        const pets = result.rows.map((p: any) => ({
            ...p,
            age: calculateAge(p.date_of_birth),
        }));

        return NextResponse.json({ pets, total: pets.length });

    } catch (error) {
        console.error("GET /api/v1/users/[id]/pet-profiles error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
