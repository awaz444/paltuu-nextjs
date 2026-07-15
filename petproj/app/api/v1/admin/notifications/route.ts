import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "../adminAuth";
import { NotificationService } from "@/lib/notifications/NotificationService";

export const dynamic = "force-dynamic";

const MAX_SYNC_RECIPIENTS = parseInt(process.env.BROADCAST_MAX_RECIPIENTS || "5000", 10);

// GET /api/v1/admin/notifications
// Paginated history of admin-sent broadcast campaigns
export async function GET(req: NextRequest) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
        const offset = (page - 1) * limit;

        const result = await db.query(
            `
            SELECT
                c.campaign_id, c.title, c.body, c.deep_link, c.image_url,
                c.recipient_count, c.sent_count, c.push_success_count,
                c.status, c.error_message, c.created_at, c.completed_at,
                u.name as sent_by_name, u.email as sent_by_email
            FROM notification_campaigns c
            JOIN users u ON u.user_id = c.sent_by
            ORDER BY c.created_at DESC
            LIMIT $1 OFFSET $2
            `,
            [limit, offset]
        );

        const countRes = await db.query(`SELECT COUNT(*)::int FROM notification_campaigns`);
        const total = countRes.rows[0].count;

        return NextResponse.json({ rows: result.rows, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (error: any) {
        console.error("Admin Notifications GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/v1/admin/notifications
// Send a custom push notification broadcast to all app users
export async function POST(req: NextRequest) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const adminId = parseInt(String(admin.id || admin.user_id), 10);
        if (Number.isNaN(adminId)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const payload = await req.json();
        const title = typeof payload.title === "string" ? payload.title.trim() : "";
        const body = typeof payload.body === "string" ? payload.body.trim() : "";
        const deepLink = typeof payload.deepLink === "string" ? payload.deepLink.trim() : undefined;
        const imageUrl = typeof payload.imageUrl === "string" ? payload.imageUrl.trim() : undefined;

        if (!title || !body) {
            return NextResponse.json({ error: "title and body are required" }, { status: 400 });
        }

        // Duplicate-send guardrail: block identical title+body from the same admin within 60s
        const dupeCheck = await db.query(
            `
            SELECT campaign_id FROM notification_campaigns
            WHERE sent_by = $1 AND title = $2 AND body = $3
              AND created_at > NOW() - INTERVAL '60 seconds'
            `,
            [adminId, title, body]
        );
        if ((dupeCheck.rowCount || 0) > 0) {
            return NextResponse.json(
                { error: "An identical broadcast was just sent. Wait a minute or change the message." },
                { status: 409 }
            );
        }

        const countRes = await db.query(`SELECT COUNT(*)::int FROM users`);
        const userCount = countRes.rows[0].count;
        if (userCount > MAX_SYNC_RECIPIENTS) {
            return NextResponse.json(
                { error: `Audience too large (${userCount} users, limit is ${MAX_SYNC_RECIPIENTS}).` },
                { status: 400 }
            );
        }

        const campaignInsert = await db.query(
            `
            INSERT INTO notification_campaigns (title, body, deep_link, image_url, recipient_count, status, sent_by, created_at)
            VALUES ($1, $2, $3, $4, $5, 'processing', $6, NOW())
            RETURNING campaign_id
            `,
            [title, body, deepLink || null, imageUrl || null, userCount, adminId]
        );
        const campaignId = campaignInsert.rows[0].campaign_id;

        try {
            const result = await NotificationService.broadcastToAllUsers({
                senderId: adminId,
                title,
                body,
                deepLink,
                imageUrl,
            });

            const fullySent = result.insertedCount === result.recipientCount;
            const noPushFailures = result.pushFailureCount === 0;
            const status = fullySent && noPushFailures ? "sent" : "partial";

            await db.query(
                `
                UPDATE notification_campaigns
                SET status = $1, sent_count = $2, push_success_count = $3, completed_at = NOW()
                WHERE campaign_id = $4
                `,
                [status, result.insertedCount, result.pushSuccessCount, campaignId]
            );

            return NextResponse.json({
                campaign_id: campaignId,
                recipient_count: result.recipientCount,
                sent_count: result.insertedCount,
                push_success_count: result.pushSuccessCount,
                status,
            });
        } catch (sendError: any) {
            console.error("❌ Broadcast send failed:", sendError);
            await db.query(
                `
                UPDATE notification_campaigns
                SET status = 'failed', error_message = $1, completed_at = NOW()
                WHERE campaign_id = $2
                `,
                [String(sendError?.message || sendError), campaignId]
            );
            return NextResponse.json({ error: "Failed to send broadcast" }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Admin Notifications POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
