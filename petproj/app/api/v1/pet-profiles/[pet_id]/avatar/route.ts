import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/pet-profiles/:pet_id/avatar
 * Set the pet profile's avatar_url from an existing gallery photo URL.
 * Auth required, owner only.
 *
 * Body: { avatar_url: string }
 * The avatar_url can be any URL — typically from a gallery photo already uploaded.
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: { pet_id: string } }
) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(String(userIdRaw), 10);

        // Fetch profile to verify ownership
        const profileRes = await db.query(
            "SELECT pet_profile_id, owner_id FROM pet_profiles WHERE pet_profile_id = $1",
            [params.pet_id]
        );

        if (profileRes.rowCount === 0) {
            return NextResponse.json({ error: "Pet profile not found" }, { status: 404 });
        }
        if (profileRes.rows[0].owner_id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { avatar_url } = body;

        if (!avatar_url || String(avatar_url).trim().length === 0) {
            return NextResponse.json({ error: "avatar_url is required" }, { status: 400 });
        }

        const result = await db.query(
            `UPDATE pet_profiles
             SET avatar_url = $1, updated_at = NOW()
             WHERE pet_profile_id = $2
             RETURNING pet_profile_id, avatar_url, updated_at`,
            [String(avatar_url).trim(), params.pet_id]
        );

        return NextResponse.json(result.rows[0]);

    } catch (error) {
        console.error("PATCH /api/v1/pet-profiles/[pet_id]/avatar error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
