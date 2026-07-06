import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

function errorResponse(code: string, message: string, status: number) {
    return NextResponse.json({ error: { code, message, status } }, { status });
}

/**
 * GET /api/v1/explore/lost-found-nearby
 * Recent active lost & found posts in the viewer's city, falling back to
 * all cities when the viewer has no city set (or their city has no posts).
 */
export async function GET(req: NextRequest) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return errorResponse("UNAUTHORIZED", "Missing or invalid JWT", 401);

        const userId = parseInt(String(userIdRaw), 10);
        const { searchParams } = new URL(req.url);
        const limit = Math.min(20, parseInt(searchParams.get("limit") || "10", 10));

        const viewerRes = await db.query(
            "SELECT city_id FROM users WHERE user_id = $1",
            [userId]
        );
        const viewerCityId: number | null = viewerRes.rows[0]?.city_id ?? null;

        const baseSelect = `
            SELECT
                p.post_id,
                p.post_type,
                p.pet_description,
                p.location,
                p.date,
                p.post_date,
                c.city_name AS city,
                (
                    SELECT i.image_url FROM lost_and_found_post_images i
                    WHERE i.post_id = p.post_id
                    ORDER BY i.image_id ASC
                    LIMIT 1
                ) AS main_image
            FROM lost_and_found_posts p
            LEFT JOIN cities c ON c.city_id = p.city_id
            WHERE COALESCE(p.status, 'active') = 'active'
        `;

        let rows: any[] = [];
        let matchedCity: string | null = null;

        if (viewerCityId) {
            const cityRes = await db.query(
                `${baseSelect} AND p.city_id = $2 ORDER BY p.post_date DESC, p.post_id DESC LIMIT $1`,
                [limit, viewerCityId]
            );
            rows = cityRes.rows;
            matchedCity = rows[0]?.city ?? null;
        }

        if (rows.length === 0) {
            const globalRes = await db.query(
                `${baseSelect} ORDER BY p.post_date DESC, p.post_id DESC LIMIT $1`,
                [limit]
            );
            rows = globalRes.rows;
            matchedCity = null;
        }

        return NextResponse.json({
            city: matchedCity,
            posts: rows,
        });

    } catch (error) {
        console.error("V1 Lost & Found Nearby error:", error);
        return errorResponse("INTERNAL_ERROR", "An unhandled exception occurred", 500);
    }
}
