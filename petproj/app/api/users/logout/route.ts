import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_BASE_URL));

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
        secure: true, // Ensures proper deletion over HTTPS
        sameSite: "lax", // Helps with cross-site behavior
      });
    });

    return response;
  } catch (error: any) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"));
  }
}