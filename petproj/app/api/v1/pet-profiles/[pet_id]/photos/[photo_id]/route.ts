import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/pet-profiles/:pet_id/photos/:photo_id
 * Update a gallery photo's caption.
 * Auth required, owner only.
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: { pet_id: string; photo_id: string } }
) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(String(userIdRaw), 10);

        const body = await req.json();
        const caption = typeof body.caption === "string" ? body.caption.trim() || null : null;

        // Verify photo exists and belongs to a profile owned by this user
        const photoRes = await db.query(
            `SELECT ppp.photo_id, pp.owner_id
             FROM pet_profile_photos ppp
             JOIN pet_profiles pp ON pp.pet_profile_id = ppp.pet_profile_id
             WHERE ppp.photo_id = $1 AND ppp.pet_profile_id = $2`,
            [params.photo_id, params.pet_id]
        );

        if (photoRes.rowCount === 0) {
            return NextResponse.json({ error: "Photo not found" }, { status: 404 });
        }

        if (photoRes.rows[0].owner_id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updateRes = await db.query(
            "UPDATE pet_profile_photos SET caption = $1 WHERE photo_id = $2 RETURNING *",
            [caption, params.photo_id]
        );

        return NextResponse.json(updateRes.rows[0]);

    } catch (error) {
        console.error("PATCH /api/v1/pet-profiles/[pet_id]/photos/[photo_id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * DELETE /api/v1/pet-profiles/:pet_id/photos/:photo_id
 * Remove a photo from a pet profile gallery.
 * Auth required, owner only.
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { pet_id: string; photo_id: string } }
) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(String(userIdRaw), 10);

        // Verify photo exists and belongs to a profile owned by this user
        const photoRes = await db.query(
            `SELECT ppp.photo_id, pp.owner_id
             FROM pet_profile_photos ppp
             JOIN pet_profiles pp ON pp.pet_profile_id = ppp.pet_profile_id
             WHERE ppp.photo_id = $1 AND ppp.pet_profile_id = $2`,
            [params.photo_id, params.pet_id]
        );

        if (photoRes.rowCount === 0) {
            return NextResponse.json({ error: "Photo not found" }, { status: 404 });
        }

        if (photoRes.rows[0].owner_id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await db.query(
            "DELETE FROM pet_profile_photos WHERE photo_id = $1",
            [params.photo_id]
        );

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("DELETE /api/v1/pet-profiles/[pet_id]/photos/[photo_id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
