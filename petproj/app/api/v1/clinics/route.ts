import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/clinics:
 *   get:
 *     summary: Get paginated clinics with optional filters
 *     tags: [v1 Professional]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter clinics by city (e.g. Karachi, Lahore, Islamabad)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by clinic category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search clinics by name, address, or city
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *         description: Only return verified clinics
 *       - in: query
 *         name: partner
 *         schema:
 *           type: boolean
 *         description: Only return Paltuu partner clinics
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [rating, distance]
 *         description: Sort order — "distance" requires lat/lng
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *         description: Max 50
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *         description: Skip pagination and return every matching clinic (e.g. for map pins) — ignores page/limit
 */

const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 50;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const city     = searchParams.get("city");
        const category = searchParams.get("category");
        const search   = searchParams.get("search");
        const verified = searchParams.get("verified") === "true";
        const partner  = searchParams.get("partner") === "true";
        const sort     = searchParams.get("sort");
        const lat      = parseFloat(searchParams.get("lat") ?? "");
        const lng      = parseFloat(searchParams.get("lng") ?? "");
        const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
        const all      = searchParams.get("all") === "true";

        const page  = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
        const limit = Math.min(
            MAX_LIMIT,
            Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
        );
        const offset = (page - 1) * limit;

        // Always require a logo — clinics without one are not shown publicly
        const conditions: string[] = ["c.logo_url IS NOT NULL"];
        const params: any[] = [];

        if (city) {
            params.push(city);
            conditions.push(`LOWER(c.city) = LOWER($${params.length})`);
        }

        if (category) {
            params.push(`%${category}%`);
            conditions.push(`LOWER(c.category) ILIKE $${params.length}`);
        }

        if (search) {
            params.push(`%${search}%`);
            const idx = params.length;
            conditions.push(`(c.name ILIKE $${idx} OR c.address ILIKE $${idx} OR c.city ILIKE $${idx})`);
        }

        if (verified) {
            conditions.push(`c.is_verified = true`);
        }

        if (partner) {
            conditions.push(`c.is_paltuu_partner = true`);
        }

        const whereClause = `WHERE ${conditions.join(" AND ")}`;

        let orderClause = "ORDER BY c.rating DESC NULLS LAST, c.created_at DESC";
        if (sort === "distance" && hasCoords) {
            params.push(lat);
            const latIdx = params.length;
            params.push(lng);
            const lngIdx = params.length;
            orderClause = `
                ORDER BY
                    (c.latitude IS NULL OR c.longitude IS NULL),
                    6371 * 2 * asin(sqrt(
                        power(sin(radians($${latIdx} - c.latitude) / 2), 2) +
                        cos(radians($${latIdx})) * cos(radians(c.latitude)) *
                        power(sin(radians($${lngIdx} - c.longitude) / 2), 2)
                    )) ASC
            `;
        }

        let limitClause = "";
        if (!all) {
            params.push(limit);
            const limitIdx = params.length;
            params.push(offset);
            const offsetIdx = params.length;
            limitClause = `LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
        }

        const result = await db.query(`
            SELECT
                c.*,
                u.profile_image_url  AS owner_image,
                COUNT(cv.vet_id)::int AS vet_count,
                COUNT(*) OVER()::int  AS total_count
            FROM clinics c
            LEFT JOIN users u   ON c.owner_id = u.user_id
            LEFT JOIN clinic_vets cv ON c.clinic_id = cv.clinic_id
            ${whereClause}
            GROUP BY c.clinic_id, u.profile_image_url
            ${orderClause}
            ${limitClause}
        `, params);

        const total = result.rows[0]?.total_count ?? 0;
        const data = result.rows.map(({ total_count, ...row }) => row);

        const citiesResult = await db.query(`
            SELECT DISTINCT city
            FROM clinics
            WHERE logo_url IS NOT NULL AND city IS NOT NULL
            ORDER BY city
        `);

        return NextResponse.json({
            data,
            pagination: all
                ? { page: 1, limit: total, total, totalPages: 1, hasMore: false }
                : {
                    page,
                    limit,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / limit)),
                    hasMore: offset + data.length < total,
                },
            cities: citiesResult.rows.map((r) => r.city),
        });
    } catch (error) {
        console.error("V1 Clinics Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
