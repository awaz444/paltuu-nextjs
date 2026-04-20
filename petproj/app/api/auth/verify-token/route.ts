/**
 * @swagger
 * /api/auth/verify-token:
 *   get:
 *     summary: Auto-generated summary for /api/auth/verify-token
 *     tags: [Auto-Generated]
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/utils/authServer";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ valid: false, user: null }, { status: 200 });
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id || user.user_id || user.sub,
        email: user.email,
        role: user.role,
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
