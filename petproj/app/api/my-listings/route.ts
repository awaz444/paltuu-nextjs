/**
 * @swagger
 * /api/my-listings:
 *   get:
 *     summary: Get user pet listings
 *     description: Returns a list of all pet listings owned by the authenticated user.
 *     tags: [Listings]
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, getUserFromRequest } from "@/utils/authServer";

interface DecodedToken {
    id: string | number;
    email: string;
    iat?: number;
    exp?: number;
}

export async function GET(request: NextRequest) {
    try {
        const authenticatedUserId = await getUserIdFromRequest(request);

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