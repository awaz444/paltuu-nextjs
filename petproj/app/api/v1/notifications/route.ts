import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Fetch current user notifications (V1 Hardened)
 *     tags: [v1 Communications]
 *   patch:
 *     summary: Mark notifications as read (V1 Hardened)
 *     tags: [v1 Communications]
 */

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const result = await db.query(`
            SELECT notification_id, notification_content, notification_type, is_read, date_sent
            FROM notifications 
            WHERE user_id = $1 
            ORDER BY date_sent DESC 
            LIMIT 50
        `, [userId]);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("V1 Notifications GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { notification_id, mark_all_read } = await req.json();

        if (mark_all_read) {
            await db.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId]);
        } else if (notification_id) {
            const check = await db.query('SELECT user_id FROM notifications WHERE notification_id = $1', [notification_id]);
            if (check.rowCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
            if (check.rows[0].user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

            await db.query('UPDATE notifications SET is_read = true WHERE notification_id = $1', [notification_id]);
        } else {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("V1 Notifications PATCH Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
