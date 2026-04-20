import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get current user notifications (V1)
 *     tags: [v1 Notifications]
 *   patch:
 *     summary: Mark notifications as read (V1)
 *     tags: [v1 Notifications]
 */

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const unreadOnly = searchParams.get("unread") === "true";
        const countOnly = searchParams.get("count_only") === "true";

        if (countOnly) {
            const result = await db.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false', [userId]);
            return NextResponse.json({ unread_count: parseInt(result.rows[0].count, 10) });
        }

        const conditions = ["user_id = $1"];
        if (unreadOnly) conditions.push("is_read = false");

        const query = `
            SELECT notification_id, notification_content, notification_type, is_read, date_sent, entity_type, entity_id
            FROM notifications 
            WHERE ${conditions.join(" AND ")}
            ORDER BY date_sent DESC 
            LIMIT 50
        `;

        const result = await db.query(query, [userId]);
        return NextResponse.json({
            notifications: result.rows,
            unread_count: result.rows.filter(n => !n.is_read).length
        });

    } catch (error) {
        console.error("V1 Notifications GET error:", error);
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
            const result = await db.query(
                'UPDATE notifications SET is_read = true WHERE notification_id = $1 AND user_id = $2 RETURNING *',
                [notification_id, userId]
            );
            if (result.rowCount === 0) return NextResponse.json({ error: "Notification not found or access denied" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Notifications updated" });

    } catch (error) {
        console.error("V1 Notifications PATCH error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
