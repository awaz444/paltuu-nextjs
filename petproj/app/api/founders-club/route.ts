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