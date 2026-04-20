import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import bcrypt from "bcryptjs";

/**
 * @swagger
 * /api/v1/profile/password:
 *   patch:
 *     summary: Change user password (V1 Hardened)
 *     tags: [v1 Profile]
 */
export async function PATCH(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { currentPassword, newPassword } = await req.json();
        if (!currentPassword || !newPassword) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        const res = await db.query('SELECT password FROM users WHERE user_id = $1', [userId]);
        if (res.rowCount === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const isMatch = await bcrypt.compare(currentPassword, res.rows[0].password);
        if (!isMatch) return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });

        const hashed = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = $1 WHERE user_id = $2', [hashed, userId]);

        return NextResponse.json({ success: true, message: "Password updated" });
    } catch (error) {
        console.error("V1 Profile Password Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
