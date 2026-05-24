import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/social/profile/privacy
 * Updates the 'is_private' flag for the authenticated user.
 */
export async function PATCH(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        if (typeof body.is_private !== 'boolean') {
            return NextResponse.json({ error: "Invalid payload: is_private must be a boolean" }, { status: 400 });
        }

        const { is_private } = body;

        await db.query(
            `UPDATE users SET is_private = $1 WHERE user_id = $2`,
            [is_private, userId]
        );

        return NextResponse.json({ success: true, is_private });

    } catch (error) {
        console.error("V1 Social Profile Privacy PATCH error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal Server Error"
        }, { status: 500 });
    }
}
