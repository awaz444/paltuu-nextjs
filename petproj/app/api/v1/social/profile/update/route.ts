import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { validateUsername } from "@/utils/usernameValidation";
import { hasSevereIdentityMatch } from "@/lib/moderation/badWords";

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

        if (typeof body.name === 'string' && hasSevereIdentityMatch(body.name)) {
            return NextResponse.json({ error: "Please choose a different name." }, { status: 400 });
        }
        if (typeof body.bio === 'string' && hasSevereIdentityMatch(body.bio)) {
            return NextResponse.json({ error: "Please remove offensive language from your bio." }, { status: 400 });
        }

        // ── Username validation (was completely missing — critical bug) ──────────
        if (body.social_username !== undefined) {
            const validation = validateUsername(body.social_username);
            if (!validation.valid) {
                return NextResponse.json({ error: validation.error }, { status: 400 });
            }
            if (hasSevereIdentityMatch(body.social_username)) {
                return NextResponse.json({ error: "Please choose a different username." }, { status: 400 });
            }
            // Normalise to lowercase before writing
            body.social_username = validation.normalised!;

            // Case-insensitive uniqueness check
            const existing = await db.query(
                "SELECT user_id FROM users WHERE LOWER(social_username) = $1 AND user_id != $2",
                [body.social_username, userId]
            );
            if ((existing.rowCount ?? 0) > 0) {
                return NextResponse.json({ error: "This social handle is already taken." }, { status: 409 });
            }
        }

        // Email changes go through the dedicated OTP-verified flow
        // (/api/v1/auth/request-email-change + /api/v1/auth/change-email) —
        // never write it directly here, that would skip ownership verification.
        if (body.email !== undefined) {
            return NextResponse.json({ error: "Use /api/v1/auth/change-email to update your email address." }, { status: 400 });
        }

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
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true, user: result.rows[0] });

    } catch (error) {
        console.error("V1 Social Profile Update PATCH error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal Server Error"
        }, { status: 500 });
    }
}
