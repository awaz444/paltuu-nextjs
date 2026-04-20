import { invalidateMobileRefreshToken } from "@/utils/mobileAuth";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Mobile Logout (v1)
 *     tags: [v1 Auth]
 */
export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json({ message: "Refresh token is required" }, { status: 400 });
    }

    await invalidateMobileRefreshToken(refreshToken);

    return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });

  } catch (error) {
    console.error("V1 Logout error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
