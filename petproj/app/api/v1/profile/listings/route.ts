import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

type Row = Record<string, any>;

/**
 * Runs one optional dashboard query. These only add extra numbers to the cards,
 * so a failure is logged and skipped instead of failing the whole listings page.
 */
async function optional(label: string, text: string, params: unknown[]): Promise<Row[] | null> {
    try {
        const res = await db.query(text, params);
        return res.rows;
    } catch (error) {
        console.error(`V1 Profile Listings: ${label} query failed:`, error);
        return null;
    }
}

/**
 * @swagger
 * /api/v1/profile/listings:
 *   get:
 *     summary: Get authenticated user's pet listings (V1 Hardened)
 *     tags: [v1 Profile]
 */
export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const query = `
            SELECT
                p.*,
                cat.category_name AS category,
                cities.city_name AS city_name,
                (SELECT image_url FROM pet_images WHERE pet_id = p.pet_id ORDER BY "order" ASC LIMIT 1) AS image_url
            FROM pets p
            LEFT JOIN pet_category cat ON p.pet_type = cat.category_id
            LEFT JOIN cities ON p.city_id = cities.city_id
            WHERE p.owner_id = $1
            ORDER BY p.created_at DESC;
        `;
        const result = await db.query(query, [userId]);
        const listings: Row[] = result.rows;
        if (listings.length === 0) return NextResponse.json({ listings });

        // Owner-dashboard extras (photo count, application counts, recent
        // applicants). Foster listings collect foster applications; every
        // other listing type collects adoption applications.
        const petIds = listings.map((l) => l.pet_id);
        const [photos, adoptionCounts, fosterCounts, adoptionNames, fosterNames] = await Promise.all([
            optional("photo count",
                `SELECT pet_id, COUNT(*)::int AS n FROM pet_images WHERE pet_id = ANY($1) GROUP BY pet_id`, [petIds]),
            optional("adoption counts",
                `SELECT pet_id, COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'pending')::int AS pending
                 FROM adoption_applications WHERE pet_id = ANY($1) GROUP BY pet_id`, [petIds]),
            optional("foster counts",
                `SELECT pet_id, COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'pending')::int AS pending
                 FROM foster_applications WHERE pet_id = ANY($1) GROUP BY pet_id`, [petIds]),
            optional("adoption applicants",
                `SELECT pet_id, name FROM (
                     SELECT a.pet_id, u.name, ROW_NUMBER() OVER (PARTITION BY a.pet_id ORDER BY a.created_at DESC) AS rn
                     FROM adoption_applications a JOIN users u ON u.user_id = a.user_id
                     WHERE a.pet_id = ANY($1)
                 ) t WHERE rn <= 3 ORDER BY pet_id, rn`, [petIds]),
            optional("foster applicants",
                `SELECT pet_id, name FROM (
                     SELECT f.pet_id, u.name, ROW_NUMBER() OVER (PARTITION BY f.pet_id ORDER BY f.created_at DESC) AS rn
                     FROM foster_applications f JOIN users u ON u.user_id = f.user_id
                     WHERE f.pet_id = ANY($1)
                 ) t WHERE rn <= 3 ORDER BY pet_id, rn`, [petIds]),
        ]);

        const byPet = (rows: Row[] | null) => new Map((rows ?? []).map((r) => [String(r.pet_id), r]));
        const namesByPet = (rows: Row[] | null) => {
            const m = new Map<string, string[]>();
            (rows ?? []).forEach((r) => {
                const k = String(r.pet_id);
                m.set(k, [...(m.get(k) ?? []), r.name]);
            });
            return m;
        };
        const photoMap = byPet(photos);
        const adoptionMap = byPet(adoptionCounts);
        const fosterMap = byPet(fosterCounts);
        const adoptionNameMap = namesByPet(adoptionNames);
        const fosterNameMap = namesByPet(fosterNames);
        // Only report counts when they actually loaded, so the page can fall
        // back to a plain "View applications" link instead of showing zeros.
        const countsLoaded = adoptionCounts !== null && fosterCounts !== null;

        const enriched = listings.map((l) => {
            const k = String(l.pet_id);
            const isFoster = l.listing_type === "foster";
            const counts = (isFoster ? fosterMap : adoptionMap).get(k);
            return {
                ...l,
                photo_count: photoMap.get(k)?.n ?? 0,
                ...(countsLoaded && {
                    application_count: counts?.total ?? 0,
                    pending_application_count: counts?.pending ?? 0,
                }),
                recent_applicant_names: (isFoster ? fosterNameMap : adoptionNameMap).get(k) ?? [],
            };
        });

        return NextResponse.json({ listings: enriched });
    } catch (error) {
        console.error("V1 Profile Listings Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
