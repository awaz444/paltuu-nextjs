/**
 * @swagger
 * /api/get-notifications-by-id:
 *   get:
 *     summary: Auto-generated summary for /api/get-notifications-by-id
 *     tags: [Auto-Generated]
 *   post:
 *     summary: Auto-generated summary for /api/get-notifications-by-id
 *     tags: [Auto-Generated]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../db/index";
import { getServerSession } from "next-auth/next";
import jwt from "jsonwebtoken";
import { authoptions } from "../auth/[...nextauth]/options";

interface JWTPayload {
  id: string;
  name: string;
  email: string;
  role: string;
}

// GET method to fetch all notifications for the authenticated user
export async function GET(req: NextRequest): Promise<NextResponse> {
  const client = createClient();
  let userId: string | null = null;

  try {
    // Determine user via NextAuth session first
    const session = await getServerSession(authoptions);
    if (session?.user) {
      userId = (session.user as any).user_id || (session.user as any).id;
    }

    // Fallback to JWT cookie token if available
    if (!userId) {
      const token = req.cookies.get("token")?.value;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.TOKEN_SECRET!) as JWTPayload;
          userId = decoded.id;
        } catch (jwtError) {
          console.error("JWT verification failed:", jwtError);
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await client.connect();

    const result = await client.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY date_sent DESC`,
      [userId]
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
    await client.end();
  }
}

// POST method to add a notification for the authenticated user
export async function POST(req: NextRequest): Promise<NextResponse> {
  const client = createClient();
  let userId: string | null = null;

  try {
    const session = await getServerSession(authoptions);
    if (session?.user) {
      userId = (session.user as any).user_id || (session.user as any).id;
    }

    if (!userId) {
      const token = req.cookies.get("token")?.value;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.TOKEN_SECRET!) as JWTPayload;
          userId = decoded.id;
        } catch (jwtError) {
          console.error("JWT verification failed:", jwtError);
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { notification_content, notification_type, date_sent, is_read } = await req.json();
    if (!notification_content || !notification_type || !date_sent) {
      return NextResponse.json(
        { error: "All fields are required: notification_content, notification_type, date_sent, and is_read." },
        { status: 400 }
      );
    }

    await client.connect();

    const result = await client.query(
      `INSERT INTO notifications 
         (user_id, notification_content, notification_type, date_sent, is_read) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userId, notification_content, notification_type, date_sent, is_read ?? false]
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
    await client.end();
  }
}