import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * PUT /api/v1/profile/social
 * Update user's social profile details (Handle, Bio, Privacy)
 */
export async function PUT(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { social_username, bio, is_private } = body;

        // 1. If username is changing, check for uniqueness
        if (social_username) {
            // Basic handle validation: alphanumeric + underscores, 3-20 chars
            if (!/^[a-zA-Z0-9_]{3,20}$/.test(social_username)) {
                return NextResponse.json({ error: "Invalid handle. Use 3-20 alphanumeric characters or underscores." }, { status: 400 });
            }

            const existing = await db.query(
                "SELECT user_id FROM users WHERE social_username = $1 AND user_id != $2",
                [social_username, userId]
            );
            if ((existing.rowCount ?? 0) > 0) {
                return NextResponse.json({ error: "This social handle is already taken" }, { status: 400 });
            }
        }

        const allowedUpdates = ['social_username', 'bio', 'is_private'];
        const setClause: string[] = [];
        const params: any[] = [userId];

        Object.keys(body).forEach((key) => {
            if (allowedUpdates.includes(key)) {
                params.push(body[key]);
                setClause.push(`${key} = $${params.length}`);
            }
        });

        if (setClause.length === 0) {
            return NextResponse.json({ error: "No updates provided" }, { status: 400 });
        }

        const query = `
            UPDATE users 
            SET ${setClause.join(', ')}
            WHERE user_id = $1 
            RETURNING user_id, social_username, bio, is_private, follower_count, following_count, post_count
        `;

        const result = await db.query(query, params);
        return NextResponse.json(result.rows[0]);

    } catch (error) {
        console.error("V1 Profile Social PUT error:", error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Internal Server Error" 
        }, { status: 500 });
    }
}
