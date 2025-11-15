import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

export async function GET(
    req: NextRequest,
    { params }: { params: { user_id: string } }
): Promise<NextResponse> {
    const client = createClient();
    const { user_id } = params;

    if (!user_id) {
        return NextResponse.json(
            { error: "User ID is required" },
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        await client.connect();

        // Get notifications for the user
        const notificationsQuery = `
            SELECT 
                notification_id,
                notification_content,
                notification_type,
                is_read,
                date_sent
            FROM notifications 
            WHERE user_id = $1 
            ORDER BY date_sent DESC 
            LIMIT 50
        `;

        const result = await client.query(notificationsQuery, [user_id]);

        return NextResponse.json(
            { 
                user_id, 
                notifications: result.rows 
            },
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                message: (error as Error).message,
            },
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        await client.end();
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { user_id: string } }
): Promise<NextResponse> {
    const client = createClient();
    const { user_id } = params;
    const { notification_id, mark_all_read } = await req.json();

    if (!user_id) {
        return NextResponse.json(
            { error: "User ID is required" },
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        await client.connect();

        if (mark_all_read) {
            // Mark all notifications as read
            await client.query(
                'UPDATE notifications SET is_read = true WHERE user_id = $1',
                [user_id]
            );
        } else if (notification_id) {
            // Mark specific notification as read
            await client.query(
                'UPDATE notifications SET is_read = true WHERE notification_id = $1 AND user_id = $2',
                [notification_id, user_id]
            );
        }

        return NextResponse.json(
            { message: "Notifications updated successfully" },
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                message: (error as Error).message,
            },
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        await client.end();
    }
}


