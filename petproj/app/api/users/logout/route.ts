import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Create a response with JSON data first
    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    // List of authentication-related cookies to clear
    const authCookies = [
      "token",
      "next-auth.session-token",
      "next-auth.csrf-token",
      "next-auth.callback-url"
    ];

    // Clear all authentication cookies
    authCookies.forEach((cookie) => {
      response.cookies.set(cookie, "", {
        httpOnly: true,
        expires: new Date(0),
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: "Logout failed"
    }, { status: 500 });
  }
}