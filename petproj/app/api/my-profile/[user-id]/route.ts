import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";
import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const requested_user_id = req.nextUrl.pathname.split("/").pop();

    if (!requested_user_id) {
        return NextResponse.json(
            { error: "User ID is required" },
            { status: 400 }
        );
    }

    try {
        // Get authenticated user's ID from token/session
        let authenticated_user_id: string | null = null;

        // Check NextAuth token first (for Google OAuth users)
        const nextAuthToken = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET
        });

        if (nextAuthToken?.user_id) {
            authenticated_user_id = nextAuthToken.user_id.toString();
        } else {
            // Check custom JWT token (for regular login users)
            const customToken = req.cookies.get('token')?.value;
            if (customToken) {
                try {
                    const decoded = jwt.verify(customToken, process.env.TOKEN_SECRET!) as any;
                    authenticated_user_id = decoded.id?.toString();
                } catch (error) {
                    return NextResponse.json(
                        { error: "Invalid token" },
                        { status: 401 }
                    );
                }
            }
        }

        // If no authenticated user found
        if (!authenticated_user_id) {
            return NextResponse.json(
                { error: "Unauthorized - Please login" },
                { status: 401 }
            );
        }

        // CRITICAL: Verify that the authenticated user can only access their own profile
        if (authenticated_user_id !== requested_user_id) {
            return NextResponse.json(
                { error: "Forbidden - You can only access your own profile" },
                { status: 403 }
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

        const response = {
            user_id: user.user_id,
            name: user.name,
            dob: user.dob,
            email: user.email,
            phone_number: user.phone_number,
            profile_image_url: user.profile_image_url,
            city: user.city,
            created_at: user.created_at,
        };

        return NextResponse.json(response, {
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
    const requested_user_id = req.nextUrl.pathname.split("/").pop();

    if (!requested_user_id) {
        return NextResponse.json(
            { error: "User ID is required" },
            { status: 400 }
        );
    }

    try {
        // Same authorization logic for PATCH
        let authenticated_user_id: string | null = null;

        const nextAuthToken = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET
        });

        if (nextAuthToken?.user_id) {
            authenticated_user_id = nextAuthToken.user_id.toString();
        } else {
            const customToken = req.cookies.get('token')?.value;
            if (customToken) {
                try {
                    const decoded = jwt.verify(customToken, process.env.TOKEN_SECRET!) as any;
                    authenticated_user_id = decoded.id?.toString();
                } catch (error) {
                    return NextResponse.json(
                        { error: "Invalid token" },
                        { status: 401 }
                    );
                }
            }
        }

        if (!authenticated_user_id) {
            return NextResponse.json(
                { error: "Unauthorized - Please login" },
                { status: 401 }
            );
        }

        // CRITICAL: Verify authorization for updates too
        if (authenticated_user_id !== requested_user_id) {
            return NextResponse.json(
                { error: "Forbidden - You can only update your own profile" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { name, dob, phone_number, city, profile_image_url } = body;

        await client.connect();

        // Get city_id if city name is provided
        let cityId = null;
        if (city) {
            const cityQuery = 'SELECT city_id FROM cities WHERE city_name = $1';
            const cityResult = await client.query(cityQuery, [city]);
            if (cityResult.rows.length > 0) {
                cityId = cityResult.rows[0].city_id;
            }
        }

        const updateQuery = `
            UPDATE users
            SET name = COALESCE($1, name),
                dob = COALESCE($2, dob),
                phone_number = COALESCE($3, phone_number),
                city_id = COALESCE($4, city_id),
                profile_image_url = COALESCE($5, profile_image_url)
            WHERE user_id = $6
            RETURNING user_id, name, dob, email, phone_number, profile_image_url;
        `;

        const result = await client.query(updateQuery, [
            name, dob, phone_number, cityId, profile_image_url, authenticated_user_id
        ]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "User not found or update failed" },
                { status: 404 }
            );
        }

        // Fetch updated user with city name
        const fetchQuery = `
            SELECT u.user_id, u.name, u.dob, u.email, u.phone_number,
                   u.profile_image_url, c.city_name AS city, u.created_at
            FROM users u
            LEFT JOIN cities c ON u.city_id = c.city_id
            WHERE u.user_id = $1;
        `;

        const fetchResult = await client.query(fetchQuery, [authenticated_user_id]);
        const updatedUser = fetchResult.rows[0];

        return NextResponse.json({
            message: "Profile updated successfully",
            user: {
                user_id: updatedUser.user_id,
                name: updatedUser.name,
                dob: updatedUser.dob,
                email: updatedUser.email,
                phone_number: updatedUser.phone_number,
                profile_image_url: updatedUser.profile_image_url,
                city: updatedUser.city,
                created_at: updatedUser.created_at,
            }
        }, { status: 200 });

    } catch (err) {
        console.error('Error updating user profile:', err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}