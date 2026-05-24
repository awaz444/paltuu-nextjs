import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/social/profile/update
 * Updates user profile and personal information.
 */
export async function PATCH(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (body.name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            values.push(body.name);
        }
        if (body.social_username !== undefined) {
            updates.push(`social_username = $${paramIndex++}`);
            values.push(body.social_username);
        }
        if (body.bio !== undefined) {
            updates.push(`bio = $${paramIndex++}`);
            values.push(body.bio);
        }
        if (body.email !== undefined) {
            updates.push(`email = $${paramIndex++}`);
            values.push(body.email);
        }
        if (body.phone_number !== undefined) {
            updates.push(`phone_number = $${paramIndex++}`);
            values.push(body.phone_number);
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: "No fields to update provided." }, { status: 400 });
        }

        values.push(userId);
        const query = `
            UPDATE users 
            SET ${updates.join(', ')} 
            WHERE user_id = $${paramIndex}
            RETURNING user_id, name, social_username, bio, email, phone_number
        `;

        const result = await db.query(query, values);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, user: result.rows[0] });

    } catch (error) {
        console.error("V1 Social Profile Update PATCH error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal Server Error"
        }, { status: 500 });
    }
}
