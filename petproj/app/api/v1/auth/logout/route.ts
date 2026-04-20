import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { invalidateMobileRefreshToken } from "@/utils/mobileAuth";

/**
 * @swagger
 * /api/v1/auth/logout:
 *   get:
 *     summary: Web Logout (v1) - Clears cookies
 *     tags: [v1 Auth]
 *   post:
 *     summary: Mobile Logout (v1)
 *     tags: [v1 Auth]
 */

export async function GET() {
    const response = NextResponse.json({ message: "Logged out successfully" });
    
    // Clear the auth cookie
    cookies().set("session_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(0),
    });

    return response;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { refreshToken } = body;

    if (refreshToken) {
      await invalidateMobileRefreshToken(refreshToken);
    }

    // Also clear cookies if any
    cookies().set("session_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(0),
    });

    return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });

  } catch (error) {
    console.error("V1 Logout error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
