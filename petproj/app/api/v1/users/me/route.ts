import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/users/me:
 *   delete:
 *     summary: Delete currently logged-in user account (Compliance)
 *     tags: [v1 Users]
 */
export async function DELETE(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Generate randomized credentials to prevent future logins and release original email
        const randomHash = Math.random().toString(36).substring(2, 10);
        const scrambledEmail = `deleted_${userId}_${randomHash}@paltuu.pk`;
        const scrambledPassword = `DELETED_${Math.random().toString(36)}`;

        // Anonymize the user record (removing PII) while preserving content relationships
        await db.query(`
            UPDATE users 
            SET 
                name = 'Paltuu Member',
                email = $1,
                password = $2,
                phone_number = NULL,
                profile_image_url = NULL,
                oauth_provider = NULL,
                oauth_id = NULL
            WHERE user_id = $3
        `, [scrambledEmail, scrambledPassword, userId]);

        return NextResponse.json({ success: true, message: "Account deleted and anonymized successfully" });
    } catch (error) {
        console.error("V1 User Me DELETE (Anonymize) Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
