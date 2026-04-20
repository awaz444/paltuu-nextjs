import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users (Admin V1)
 *     tags: [v1 Admin]
 *   delete:
 *     summary: Delete a user (Admin V1)
 *     tags: [v1 Admin]
 */

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
        }

        const result = await db.query(`
            SELECT user_id, name, email, role, created_at, profile_image_url
            FROM users
            ORDER BY created_at DESC
        `);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("V1 Admin Users GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { user_id } = await req.json();
        if (!user_id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

        // Prevent admin from deleting themselves if needed, or just proceed
        if (String(user_id) === String(user.id || user.user_id)) {
            return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
        }

        await db.query('DELETE FROM users WHERE user_id = $1', [user_id]);
        return NextResponse.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("V1 Admin Users DELETE Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
