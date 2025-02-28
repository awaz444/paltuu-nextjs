import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL));

    // Clear all authentication-related cookies
    response.cookies.set("token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: '/'
    });

    response.cookies.set("next-auth.session-token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: '/'
    });

    response.cookies.set("next-auth.csrf-token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: '/'
    });

    response.cookies.set("next-auth.callback-url", "", {
      httpOnly: true,
      expires: new Date(0),
      path: '/'
    });

    return response;
  } catch (error: any) {
    // If there's an error, redirect to login page anyway
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL));
  }
}