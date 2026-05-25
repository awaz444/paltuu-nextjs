import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/notifications
 * Fetch notifications for the logged-in user
 * ?cursor=timestamp&limit=20&filter=social|adoptions|orders&unread_only=true
 */
export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
        const cursor = searchParams.get("cursor");
        const filter = searchParams.get("filter"); // social | adoptions | orders
        const unreadOnly = searchParams.get("unread_only") === "true";

        const conditions: string[] = [
            "n.user_id = $1",
            `(n.sender_id IS NULL OR NOT EXISTS (
                SELECT 1 FROM user_blocks b 
                WHERE (b.blocker_id = $1 AND b.blocked_id = n.sender_id)
                   OR (b.blocker_id = n.sender_id AND b.blocked_id = $1)
            ))`
        ];
        const queryParams: any[] = [userId, limit];
        let paramIndex = 3;

        // Type filter
        if (filter && filter !== 'all') {
            const typeMap: Record<string, string> = {
                social: 'social_%',
                adoptions: 'adoption_%',
                orders: 'bazaar_%',
            };
            const pattern = typeMap[filter];
            if (pattern) {
                conditions.push(`n.type LIKE $${paramIndex++}`);
                queryParams.push(pattern);
            }
        }

        if (cursor) {
            conditions.push(`n.created_at < $${paramIndex++}`);
            queryParams.push(cursor);
        }
        if (unreadOnly) {
            conditions.push("n.is_read = false");
        }

        const whereClause = conditions.map(c => `(${c})`).join(' AND ');

        const result = await db.query(`
            SELECT 
                n.*,
                u.name              AS sender_name,
                u.profile_image_url AS sender_image,
                u.social_username   AS sender_social_username
            FROM notifications n
            LEFT JOIN users u ON u.user_id = n.sender_id
            WHERE ${whereClause}
            ORDER BY n.created_at DESC
            LIMIT $2
        `, queryParams);

        const notifications = result.rows.map((row: any) => ({
            notification_id: row.notification_id,
            type: row.type,
            title: row.title,
            body: row.body,
            entity_type: row.entity_type,
            entity_id: row.entity_id,
            deep_link: row.deep_link,
            image_url: row.image_url,
            is_read: row.is_read,
            created_at: row.created_at,
            sender: row.sender_id ? {
                user_id: row.sender_id,
                name: row.sender_name,
                profile_image_url: row.sender_image,
                social_username: row.sender_social_username,
            } : null,
        }));

        const nextCursor = notifications.length === limit
            ? notifications[notifications.length - 1].created_at
            : null;

        // Unread count (all types, not just filtered)
        const unreadRes = await db.query(
            `SELECT COUNT(*) AS count FROM notifications 
             WHERE user_id = $1 AND is_read = false
             AND (sender_id IS NULL OR NOT EXISTS (
                 SELECT 1 FROM user_blocks b 
                 WHERE (b.blocker_id = $1 AND b.blocked_id = sender_id)
                    OR (b.blocker_id = sender_id AND b.blocked_id = $1)
             ))`,
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
 * Mark all notifications as read
 */
export async function PATCH(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await db.query(
            `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
            [userId]
        );

        return NextResponse.json({ marked_read: true });

    } catch (error) {
        console.error("V1 Social Notifications PATCH error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
