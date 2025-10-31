import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth/next";
import { authoptions } from "@/app/api/auth/[...nextauth]/options";

interface DecodedToken {
    id: string | number;
    email: string;
    iat?: number;
    exp?: number;
}

export async function GET(request: NextRequest) {
    try {
        let authenticatedUserId: string | null = null;

        // First, try to get user from NextAuth session (Google OAuth)
        const session = await getServerSession(authoptions);
        if (session?.user?.user_id) {
            authenticatedUserId = session.user.user_id.toString();
        } else {
            // If no NextAuth session, try to get user from custom JWT token
            const token = request.cookies.get("token")?.value;
            
            if (!token) {
                return NextResponse.json(
                    { error: "Authentication required" },
                    { status: 401 }
                );
            }

            try {
                const decoded = jwt.verify(token, process.env.TOKEN_SECRET!) as DecodedToken;
                authenticatedUserId = decoded.id.toString();
            } catch (jwtError) {
                return NextResponse.json(
                    { error: "Invalid token" },
                    { status: 401 }
                );
            }
        }

        if (!authenticatedUserId) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        // Fetch listings for the authenticated user
        const result = await db.query(
            "SELECT * FROM pets WHERE owner_id = $1 ORDER BY created_at DESC",
            [authenticatedUserId]
        );

        return NextResponse.json({
            listings: result.rows || []
        });

    } catch (error) {
        console.error("Error fetching user listings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}