/**
 * @swagger
 * /api/auth/verify-token:
 *   get:
 *     summary: Auto-generated summary for /api/auth/verify-token
 *     tags: [Auto-Generated]
 */

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    // 1️⃣ Check NextAuth token (Google / OAuth users)
    const nextAuthToken = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (nextAuthToken) {
      return NextResponse.json({
        valid: true,
        user: {
          id: nextAuthToken.user_id,
          email: nextAuthToken.email,
          role: nextAuthToken.role,
        }
      }, { status: 200 });
    }

    // 2️⃣ Check custom JWT token (API-based login)
    const token = request.cookies.get("token")?.value;

    if (!token) {
      // ✅ No token, but still return 200 with valid: false
      return NextResponse.json({ valid: false, user: null }, { status: 200 });
    }

    // 3️⃣ Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.TOKEN_SECRET!) as any;
    } catch {
      // Invalid or expired token
      return NextResponse.json({ valid: false, user: null }, { status: 200 });
    }

    // 4️⃣ Valid token
    return NextResponse.json({
      valid: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      }
    }, { status: 200 });

  } catch (error: any) {
    // Only log real server errors
    console.error("Verify-token server error:", error);
    return NextResponse.json({ valid: false, user: null }, { status: 200 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
