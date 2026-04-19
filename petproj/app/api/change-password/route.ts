/**
 * @swagger
 * /api/change-password:
 *   post:
 *     summary: Auto-generated summary for /api/change-password
 *     tags: [Auto-Generated]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../db/index";
import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";

async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
    const nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET
    });
    if (nextAuthToken?.user_id) return nextAuthToken.user_id.toString();

    const customToken = req.cookies.get('token')?.value;
    if (customToken) {
        try {
            const decoded = jwt.verify(customToken, process.env.TOKEN_SECRET!) as any;
            return decoded.id?.toString();
        } catch (error) {
            return null;
        }
    }
    return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    
    try {
        const authenticated_user_id = await getAuthenticatedUserId(req);

        if (!authenticated_user_id) {
            return NextResponse.json(
                { error: "Unauthorized - Please login" },
                { status: 401 }
            );
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: "Current and new passwords are required" },
                { status: 400 }
            );
        }

        await client.connect();

        // 1. Fetch current user password
        const fetchQuery = "SELECT password FROM users WHERE user_id = $1";
        const fetchResult = await client.query(fetchQuery, [authenticated_user_id]);

        if (fetchResult.rows.length === 0) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const user = fetchResult.rows[0];

        // 2. Verify current password (Direct comparison FOR NOW)
        const isPasswordCorrect = currentPassword === user.password;
        if (!isPasswordCorrect) {
            return NextResponse.json(
                { error: "Incorrect current password" },
                { status: 400 }
            );
        }

        // 3. Update password directly (No hashing FOR NOW)
        const updateQuery = "UPDATE users SET password = $1 WHERE user_id = $2";
        await client.query(updateQuery, [newPassword, authenticated_user_id]);

        return NextResponse.json({
            message: "Password updated successfully"
        }, { status: 200 });

    } catch (err) {
        console.error('Error changing password:', err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}
