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

export async function PUT(req: NextRequest): Promise<NextResponse> {
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

    await client.connect();

    const result = await client.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = $1`,
      [userId]
    );

    return NextResponse.json(
      { success: true, updated: result.rowCount },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error marking notifications read:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: (err as Error).message },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}