import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../db/index";

export async function POST(request: NextRequest) {
    const client = createClient();

    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        await client.connect();

        // First check if user exists with this email
        const checkUserQuery = `
            SELECT user_id, founding_club
            FROM users
            WHERE email = $1;
        `;
        const userResult = await client.query(checkUserQuery, [email]);

        if (userResult.rows.length === 0) {
            return NextResponse.json(
                { error: "No user found with this email" },
                { status: 404 }
            );
        }

        // Check if user is already in founders club
        if (userResult.rows[0].founding_club) {
            return NextResponse.json(
                { message: "User is already a member of the Founders Club" },
                { status: 200 }
            );
        }

        // Update the founding_club status
        const updateQuery = `
            UPDATE users
            SET founding_club = true
            WHERE email = $1
            RETURNING user_id, email, founding_club;
        `;
        const result = await client.query(updateQuery, [email]);

        return NextResponse.json({
            message: "Successfully registered for Founders Club",
            user: result.rows[0]
        }, { status: 200 });

    } catch (error) {
        console.error("Founders Club registration error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
    const userId = req.nextUrl.searchParams.get("user_id");

    if (!userId) {
        return NextResponse.json(
            { success: false, error: "Missing user_id" },
            { status: 400 }
        );
    }

    const client = createClient();

    try {
        await client.connect();

        const query = `
            SELECT founding_club FROM users
            WHERE user_id = $1
            LIMIT 1;
        `;

        const result = await client.query(query, [userId]);

        if (result.rowCount === 0) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                isFoundersClub: result.rows[0].founding_club === true,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("Founders Club check error:", err);
        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
                message: (err as Error).message,
            },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}