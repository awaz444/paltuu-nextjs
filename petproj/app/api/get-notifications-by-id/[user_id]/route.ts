import { createClient } from "../../../../db/index";
import { NextRequest, NextResponse } from "next/server";

// POST method to add a notification
export async function POST(req: NextRequest, { params }: { params: { user_id: string } }): Promise<NextResponse> {
    const { user_id } = params;
    const { notification_content, notification_type, date_sent, is_read } = await req.json();
    const client = createClient();

    try {
        await client.connect(); // Connect to the database

        if (!notification_content || !notification_type || !date_sent) {
            return NextResponse.json(
                { error: "All fields are required: notification_content, notification_type, date_sent, and is_read." },
                { status: 400 }
            );
        }

        const result = await client.query(
            `INSERT INTO notifications 
                (user_id, notification_content, notification_type, date_sent, is_read) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [user_id, notification_content, notification_type, date_sent, is_read ?? false] // Default to false if is_read is not provided
        );

        return NextResponse.json(result.rows[0], {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Error adding notification:", err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end(); // Always close the connection
    }
}

// GET method to fetch all notifications for a specific user_id
export async function GET(req: NextRequest, { params }: { params: { user_id: string } }): Promise<NextResponse> {
    const client = createClient();
    const { user_id } = params;

    if (!user_id) {
        return NextResponse.json(
            { error: "User ID is required in the URL path (e.g., /api/notifications/1)" },
            { status: 400 }
        );
    }

    try {
        await client.connect(); // Connect to the database

        const result = await client.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY date_sent DESC`, 
            [user_id]
        );

        return NextResponse.json(result.rows, {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Error fetching notifications:", err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end(); // Always close the connection
    }
}
