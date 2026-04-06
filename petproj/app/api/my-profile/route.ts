import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../db/index";
import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";

async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
    // Check NextAuth token first (for Google OAuth users)
    const nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET
    });

    if (nextAuthToken?.user_id) {
        return nextAuthToken.user_id.toString();
    }

    // Check custom JWT token (for regular login users)
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

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    
    try {
        const authenticated_user_id = await getAuthenticatedUserId(req);

        if (!authenticated_user_id) {
            return NextResponse.json(
                { error: "Unauthorized - Please login" },
                { status: 401 }
            );
        }

        await client.connect();

        const query = `
            SELECT
                u.user_id,
                u.name,
                u.dob,
                u.email,
                u.profile_image_url,
                u.phone_number,
                c.city_name AS city,
                u.created_at
            FROM users u
            LEFT JOIN cities c ON u.city_id = c.city_id
            WHERE u.user_id = $1;
        `;

        const result = await client.query(query, [authenticated_user_id]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const user = result.rows[0];

        return NextResponse.json({
            user_id: user.user_id,
            name: user.name,
            dob: user.dob,
            email: user.email,
            phone_number: user.phone_number,
            profile_image_url: user.profile_image_url,
            city: user.city,
            created_at: user.created_at,
        }, {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        const authenticated_user_id = await getAuthenticatedUserId(req);

        if (!authenticated_user_id) {
            return NextResponse.json(
                { error: "Unauthorized - Please login" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { name, profile_image_url } = body;

        await client.connect();

        const updateQuery = `
            UPDATE users
            SET name = COALESCE($1, name),
                profile_image_url = COALESCE($2, profile_image_url)
            WHERE user_id = $3
            RETURNING user_id, name, email, profile_image_url;
        `;

        const result = await client.query(updateQuery, [
            name, profile_image_url, authenticated_user_id
        ]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "User not found or update failed" },
                { status: 404 }
            );
        }

        // Fetch updated user with created_at for consistency
        const fetchQuery = `
            SELECT u.user_id, u.name, u.email, u.profile_image_url, u.created_at
            FROM users u
            WHERE u.user_id = $1;
        `;

        const fetchResult = await client.query(fetchQuery, [authenticated_user_id]);
        const updatedUser = fetchResult.rows[0];

        return NextResponse.json({
            message: "Profile updated successfully",
            user: {
                user_id: updatedUser.user_id,
                name: updatedUser.name,
                email: updatedUser.email,
                profile_image_url: updatedUser.profile_image_url,
                created_at: updatedUser.created_at,
            }
        }, { status: 200 });

    } catch (err) {
        console.error('Error updating profile:', err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}
