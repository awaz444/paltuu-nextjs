import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const user_id = req.nextUrl.pathname.split("/").pop();

    if (!user_id) {
        return NextResponse.json(
            { error: "User ID is required" },
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    try {
        await client.connect();

        // Query to get the profile_verified field from the vets table based on user_id
        const query = `
            SELECT profile_verified
            FROM vets
            WHERE user_id = $1
            LIMIT 1;
        `;

        const result = await client.query(query, [user_id]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Vet not found for the given user ID" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const { profile_verified } = result.rows[0];

        return NextResponse.json(
            { user_id, profile_verified },
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    } finally {
        await client.end();
    }
}
