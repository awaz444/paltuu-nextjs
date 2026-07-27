import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/lost-and-found/[id]
 * Single lost/found post detail — backs the feed card's tap-through and any
 * other direct link to a report.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const result = await db.query(
            `SELECT
                p.*,
                c.city_name AS city,
                cat.category_name AS category,
                u.name AS user_name,
                u.profile_image_url AS user_profile_image,
                COALESCE(
                    (SELECT json_agg(img.image_url ORDER BY img.image_id)
                     FROM lost_and_found_post_images img
                     WHERE img.post_id = p.post_id),
                    '[]'::json
                ) AS images
             FROM lost_and_found_posts p
             JOIN cities c ON p.city_id = c.city_id
             JOIN pet_category cat ON p.category_id = cat.category_id
             JOIN users u ON p.user_id = u.user_id
             WHERE p.post_id = $1`,
            [params.id]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("V1 Lost and Found [id] GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
