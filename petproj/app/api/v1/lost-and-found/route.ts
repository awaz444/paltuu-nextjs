import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { validate } from "@/utils/validation";

/**
 * @swagger
 * /api/v1/lost-and-found:
 *   get:
 *     summary: Get all active lost and found posts (V1)
 *     tags: [v1 LostAndFound]
 *   post:
 *     summary: Create a new lost and found post (V1)
 *     tags: [v1 LostAndFound]
 */

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const cityId = searchParams.get("city");
        const type = searchParams.get("type"); // lost / found

        const conditions = ["lfp.status != 'resolved'"];
        const values = [];
        let pIdx = 1;

        if (cityId) { values.push(parseInt(cityId)); conditions.push(`lfp.city_id = $${pIdx++}`); }
        if (type) { values.push(type); conditions.push(`lfp.post_type = $${pIdx++}`); }

        const query = `
            SELECT 
                lfp.*, 
                c.city_name AS city,
                pc.category_name AS category,
                u.name AS user_name,
                u.profile_image_url AS user_image,
                (SELECT image_url FROM lost_and_found_post_images WHERE post_id = lfp.post_id LIMIT 1) as main_image
            FROM lost_and_found_posts lfp
            JOIN cities c ON lfp.city_id = c.city_id
            JOIN pet_category pc ON lfp.category_id = pc.category_id
            JOIN users u ON lfp.user_id = u.user_id
            WHERE ${conditions.join(" AND ")}
            ORDER BY lfp.post_date DESC;
        `;

        const result = await db.query(query, values);
        return NextResponse.json(result.rows);

    } catch (error) {
        console.error("V1 LostAndFound GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        
        const validation = validate(body, {
            post_type: { required: true },
            pet_description: { required: true, min: 10 },
            city_id: { required: true },
            location: { required: true },
            contact_info: { required: true },
            category_id: { required: true }
        });

        if (!validation.success) return NextResponse.json({ errors: validation.errors }, { status: 400 });

        const {
            post_type, pet_description, city_id, location, contact_info, category_id, date
        } = body;

        const result = await db.query(`
            INSERT INTO lost_and_found_posts (
                user_id, post_type, pet_description, city_id, location, 
                contact_info, category_id, date, post_date
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
            RETURNING *
        `, [userId, post_type, pet_description, city_id, location, contact_info, category_id, date]);

        return NextResponse.json(result.rows[0], { status: 201 });

    } catch (error) {
        console.error("V1 LostAndFound POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
