import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient(); // Database client
    const post_id = req.nextUrl.pathname.split('/').pop(); // Extract post_id from the URL

    if (!post_id) {
        return NextResponse.json(
            { error: "Post ID is required" },
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
            posts.post_id,
            posts.user_id,
            posts.post_type,
            posts.pet_description,
            posts.city_id,
            cities.city_name AS city_name,
            posts.location,
            posts.contact_info,
            posts.post_date,
            posts.status,
            posts.category_id,
            users.username AS user_name,
            users.email AS user_email,
            users.phone_number AS user_phone,
            images.image_id,
            images.image_url
        FROM lost_and_found_posts AS posts
        LEFT JOIN lost_and_found_post_images AS images 
            ON posts.post_id = images.post_id
        LEFT JOIN cities 
            ON posts.city_id = cities.city_id
        LEFT JOIN users 
            ON posts.user_id = users.user_id
        WHERE posts.post_id = $1
        `;

        const result = await client.query(query, [post_id]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Post not found" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const postData = result.rows[0];
        const images = result.rows.map((row) => ({
            image_id: row.image_id,
            image_url: row.image_url,
        }));

        const response = {
            ...postData, // Include all post details from the first row
            images,      // Include all associated images
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
        await client.end(); // Close the database connection
    }
}
