import { db } from "@/db/index";
import { generateMobileTokenPair, invalidateMobileRefreshToken, verifyRefreshTokenInDb } from "@/utils/mobileAuth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json({ message: "Refresh token is required" }, { status: 400 });
    }

    // 1. Verify token exists in DB and is not expired
    const userId = await verifyRefreshTokenInDb(refreshToken);
    if (!userId) {
      return NextResponse.json({ message: "Invalid or expired refresh token" }, { status: 401 });
    }

    // 2. Fetch user details
    const result = await db.query('SELECT user_id, email, role FROM users WHERE user_id = $1', [userId]);
    if (result.rowCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    const user = result.rows[0];

    // 3. Invalidate old token (to prevent reuse if needed, or just issue new)
    // Here we'll invalidate the old one and issue a new pair
    await invalidateMobileRefreshToken(refreshToken);

    // 4. Generate new pair
    const tokens = await generateMobileTokenPair({
      user_id: user.user_id,
      email: user.email,
      role: user.role
    });

    return NextResponse.json(tokens, { status: 200 });

  } catch (error) {
    console.error("Mobile refresh error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
