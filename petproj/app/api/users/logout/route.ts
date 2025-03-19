// /api/users/logout.js - Updated version
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Create a response
    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    // List of all possible authentication cookies
    const authCookies = [
      "token",
      "next-auth.session-token",
      "next-auth.callback-url",
      "next-auth.csrf-token",
      "__Secure-next-auth.session-token",
      "__Secure-next-auth.callback-url",
      "__Host-next-auth.csrf-token",
      // Add any other auth cookies your app might use
    ];

    // Clear all authentication cookies with various domain settings
    authCookies.forEach((cookie) => {
      // Clear with standard settings
      response.cookies.set(cookie, "", {
        httpOnly: true,
        expires: new Date(0),
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    });

    return response;
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Logout failed"
    }, { status: 500 });
  }
}