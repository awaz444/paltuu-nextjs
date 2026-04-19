import { invalidateMobileRefreshToken } from "@/utils/mobileAuth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json({ message: "Refresh token is required" }, { status: 400 });
    }

    // Invalidate the token
    await invalidateMobileRefreshToken(refreshToken);

    return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });

  } catch (error) {
    console.error("Mobile logout error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
