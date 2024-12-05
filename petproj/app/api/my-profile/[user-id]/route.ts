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

        const query = `
            SELECT 
                u.user_id, 
                u.name, 
                u.dob, 
                u.email, 
                u.profile_image_url, 
                c.city_name AS city,
                u.created_at
            FROM users u
            LEFT JOIN cities c ON u.city_id = c.city_id
            WHERE u.user_id = $1;
        `;

        const result = await client.query(query, [user_id]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "User not found" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const user = result.rows[0];

        // Structure response
        const response = {
            user_id: user.user_id,
            name: user.name,
            dob: user.dob,
            email: user.email,
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
