import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/lost-and-found:
 *   get:
 *     summary: Fetch active lost and found posts (V1 Hardened)
 *     tags: [v1 Community]
 *   post:
 *     summary: Create a new lost/found post (V1 Hardened)
 *     tags: [v1 Community]
 *   patch:
 *     summary: Update post status or details (V1 Hardened)
 *     tags: [v1 Community]
 *   delete:
 *     summary: Delete a post (V1 Hardened)
 *     tags: [v1 Community]
 */

export async function GET(req: NextRequest) {
    try {
        const query = `
            SELECT 
                p.*, 
                c.city_name AS city,
                cat.category_name AS category,
                u.phone_number AS user_phone_number,
                u.name AS user_name,
                u.profile_image_url AS user_profile_image,
                img.image_url AS image
            FROM lost_and_found_posts p
            JOIN cities c ON p.city_id = c.city_id
            JOIN pet_category cat ON p.category_id = cat.category_id
            JOIN users u ON p.user_id = u.user_id
            LEFT JOIN lost_and_found_post_images img ON p.post_id = img.post_id
            WHERE p.status != 'resolved'
            ORDER BY p.date DESC, p.post_id DESC;
        `;
        const result = await db.query(query);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("V1 Lost and Found GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { post_type, pet_description, city_id, location, contact_info, category_id, date } = body;

        if (!post_type || !pet_description || !city_id || !location || !contact_info || !category_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const result = await db.query(`
            INSERT INTO lost_and_found_posts (
                user_id, post_type, pet_description, city_id, location, 
                contact_info, category_id, date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [userId, post_type, pet_description, city_id, location, contact_info, category_id, date || new Date()]);

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error("V1 Lost and Found POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { post_id, status, pet_description } = body;

        if (!post_id) return NextResponse.json({ error: "Post ID required" }, { status: 400 });

        // Ownership check
        const check = await db.query('SELECT user_id FROM lost_and_found_posts WHERE post_id = $1', [post_id]);
        if (check.rowCount === 0) return NextResponse.json({ error: "Post not found" }, { status: 404 });
        if (check.rows[0].user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const result = await db.query(`
            UPDATE lost_and_found_posts 
            SET status = COALESCE($1, status), 
                pet_description = COALESCE($2, pet_description)
            WHERE post_id = $3
            RETURNING *
        `, [status, pet_description, post_id]);

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("V1 Lost and Found PATCH Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const post_id = searchParams.get('post_id');

        if (!post_id) return NextResponse.json({ error: "Post ID required" }, { status: 400 });

        // Ownership check
        const check = await db.query('SELECT user_id FROM lost_and_found_posts WHERE post_id = $1', [post_id]);
        if (check.rowCount === 0) return NextResponse.json({ error: "Post not found" }, { status: 404 });
        if (check.rows[0].user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await db.query('DELETE FROM lost_and_found_posts WHERE post_id = $1', [post_id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("V1 Lost and Found DELETE Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
