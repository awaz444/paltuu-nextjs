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
                u.phone_number,
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

export async function PATCH(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const user_id = req.nextUrl.pathname.split("/").pop();

    if (!user_id) {
        return NextResponse.json(
            { error: "User ID is required" },
            { status: 400 }
        );
    }

    try {
        await client.connect();
        const body = await req.json();
        const { name, email, city, dob, phone_number } = body;

        if (!name || !email || !city || !dob || !phone_number) {
            return NextResponse.json(
                { error: "All fields (name, email, city, dob, phone_number) are required" },
                { status: 400 }
            );
        }

        // Ensure the city exists or add it
        let cityId: number | null = null;

        const checkCityQuery = `SELECT city_id FROM cities WHERE city_name = $1 LIMIT 1;`;
        const checkCityResult = await client.query(checkCityQuery, [city]);

        if (checkCityResult.rows.length > 0) {
            cityId = checkCityResult.rows[0].city_id;
        } else {
            const insertCityQuery = `INSERT INTO cities (city_name) VALUES ($1) RETURNING city_id;`;
            const insertCityResult = await client.query(insertCityQuery, [city]);
            cityId = insertCityResult.rows[0].city_id;
        }

        // Update user information
        const updateQuery = `
            UPDATE users
            SET
                name = $1,
                email = $2,
                city_id = $3,
                dob = $4,
                phone_number = $5
            WHERE user_id = $6
            RETURNING
                user_id,
                name,
                email,
                dob,
                phone_number,
                (SELECT city_name FROM cities WHERE cities.city_id = users.city_id) AS city;
        `;
        const values = [name, email, cityId, dob, phone_number, user_id];

        const result = await client.query(updateQuery, values);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(result.rows[0], { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal Server Error", details: (err as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}