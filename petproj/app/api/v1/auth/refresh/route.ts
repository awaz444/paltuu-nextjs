import { db } from "@/db/index";
import { generateMobileTokenPair, invalidateMobileRefreshToken, verifyRefreshTokenInDb } from "@/utils/mobileAuth";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh Tokens (v1)
 *     tags: [v1 Auth]
 */
export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json({ message: "Refresh token is required" }, { status: 400 });
    }

    const userId = await verifyRefreshTokenInDb(refreshToken);
    if (!userId) {
      return NextResponse.json({ message: "Invalid or expired refresh token" }, { status: 401 });
    }

    const result = await db.query('SELECT user_id, name, email, role FROM users WHERE user_id = $1', [userId]);
    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    const user = result.rows[0];

    // Invalidate old and issue new
    await invalidateMobileRefreshToken(refreshToken);

    const tokens = await generateMobileTokenPair({
      user_id: user.user_id,
      email: user.email,
      role: user.role
    });

    return NextResponse.json({
      ...tokens,
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, { status: 200 });

  } catch (error) {
    console.error("V1 Refresh error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
