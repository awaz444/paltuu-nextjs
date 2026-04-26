import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/notifications
 * Fetch social notifications for the logged-in user
 * ?cursor=timestamp&limit=20&unread_only=true
 */
export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
        const cursor = searchParams.get("cursor");
        const unreadOnly = searchParams.get("unread_only") === "true";

        const conditions: string[] = [
            "n.user_id = $1",
            "n.notification_type LIKE 'social_%'"
        ];
        const queryParams: any[] = [userId, limit];
        let paramIndex = 3;

        if (cursor) {
            conditions.push(`n.date_sent < $${paramIndex++}`);
            queryParams.push(cursor);
        }
        if (unreadOnly) {
            conditions.push("n.is_read = false");
        }

        const whereClause = conditions.map(c => `(${c})`).join(' AND ');

        const result = await db.query(`
            SELECT 
                n.*,
                -- actor info (entity_id holds actor user_id for follow notifs)
                CASE 
                    WHEN n.notification_type = 'social_follow' THEN actor.name
                    ELSE actor2.name
                END AS actor_name,
                CASE 
                    WHEN n.notification_type = 'social_follow' THEN actor.profile_image_url
                    ELSE actor2.profile_image_url
                END AS actor_image,
                CASE 
                    WHEN n.notification_type = 'social_follow' THEN actor.social_username
                    ELSE actor2.social_username
                END AS actor_social_username
            FROM notifications n
            -- For follow notifs, entity_id = follower user_id
            LEFT JOIN users actor ON n.notification_type = 'social_follow' 
                AND actor.user_id = n.entity_id
            -- For post notifs, join via the post's user_id
            LEFT JOIN social_posts sp ON n.notification_type != 'social_follow' 
                AND sp.post_id::text = n.entity_id::text
            LEFT JOIN users actor2 ON actor2.user_id = sp.user_id
            WHERE ${whereClause}
            ORDER BY n.date_sent DESC
            LIMIT $2
        `, queryParams);

        const notifications = result.rows;
        const nextCursor = notifications.length === limit
            ? notifications[notifications.length - 1].date_sent
            : null;

        // Get unread count
        const unreadRes = await db.query(
            `SELECT COUNT(*) AS count FROM notifications 
             WHERE user_id = $1 AND is_read = false AND notification_type LIKE 'social_%'`,
            [userId]
        );

        return NextResponse.json({
            notifications,
            unread_count: parseInt(unreadRes.rows[0].count),
            next_cursor: nextCursor,
            has_more: nextCursor !== null,
        });

    } catch (error) {
        console.error("V1 Social Notifications GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * PATCH /api/v1/social/notifications
 * Mark all social notifications as read
 */
export async function PATCH(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await db.query(
            `UPDATE notifications 
             SET is_read = true 
             WHERE user_id = $1 AND is_read = false AND notification_type LIKE 'social_%'`,
            [userId]
        );

        return NextResponse.json({ marked_read: true });

    } catch (error) {
        console.error("V1 Social Notifications PATCH error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
