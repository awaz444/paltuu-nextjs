import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = NextResponse.json({
      message: "Logout successful",
      success: true,
    });

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}