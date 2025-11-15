import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    // First check for NextAuth token (Google OAuth users)
    const nextAuthToken = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (nextAuthToken) {
      return NextResponse.json(
        {
          valid: true,
          user: {
            id: nextAuthToken.user_id,
            email: nextAuthToken.email,
            role: nextAuthToken.role,
          }
        },
        { status: 200 }
      );
    }

    // Check for custom JWT token (API-based login users)
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "No token found" },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET!) as any;

    return NextResponse.json(
      {
        valid: true,
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Token verification failed:", error.message);
    return NextResponse.json(
      { valid: false, error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
