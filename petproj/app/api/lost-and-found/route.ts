import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../db/index"; // Assumes you have a Postgres client setup

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        await client.connect();

        const query = `
            SELECT 
                lost_and_found_posts.*, 
                cities.city_name AS city,
                pet_category.category_name AS category,
                users.phone_number AS user_phone_number,
                lost_and_found_post_images.image_url AS image
            FROM lost_and_found_posts
            JOIN cities ON lost_and_found_posts.city_id = cities.city_id
            JOIN pet_category ON lost_and_found_posts.category_id = pet_category.category_id
            JOIN users ON lost_and_found_posts.user_id = users.user_id
            LEFT JOIN lost_and_found_post_images ON lost_and_found_posts.post_id = lost_and_found_post_images.post_id
            WHERE lost_and_found_posts.status != 'resolved'
            ORDER BY lost_and_found_posts.post_date DESC;
        `;
    

        const result = await client.query(query);

        return NextResponse.json(result.rows, {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { 
                error: "Internal Server Error", 
                message: (err as Error).message || "An unknown error occurred" 
            },
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    } finally {
        await client.end();
    }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        const body = await req.json();
        const {
            user_id,
            post_type,
            pet_description,
            city_id,
            location,
            phone_number,
            post_date,
            status,
            category_id,
        } = body;

        if (
            !user_id ||
            !post_type ||
            !pet_description ||
            !city_id ||
            !location ||
            !phone_number ||
            !post_date ||
            !status ||
            !category_id
        ) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        await client.connect();

        const query = `
        INSERT INTO lost_and_found_posts (
            user_id, post_type, pet_description, city_id, location, 
            phone_number, post_date, status, category_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
        `;
        const values = [
            user_id,
            post_type,
            pet_description,
            city_id,
            location,
            phone_number,
            post_date,
            status,
            category_id,
        ];

        const result = await client.query(query, values);

        return NextResponse.json(result.rows[0], {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { 
                error: "Internal Server Error", 
                message: (err as Error).message || "An unknown error occurred" 
            },
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    } finally {
        await client.end();
    }
}
