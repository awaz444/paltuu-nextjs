import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

function errorResponse(code: string, message: string, status: number) {
    return NextResponse.json({ error: { code, message, status } }, { status });
}

const CLINIC_FIELDS = `
    c.clinic_id,
    c.name,
    c.address,
    c.city,
    c.logo_url,
    c.rating,
    c.total_reviews,
    COALESCE(c.is_paltuu_partner, false) AS is_paltuu_partner,
    COALESCE(c.is_verified, false) AS is_verified,
    c.listing_type,
    c.coverage_area
`;

// Past this, "near you" stops being true. Without the cap the distance sort
// happily returns clinics on another continent (a Cupertino-based simulator
// gets Islamabad clinics at ~11,900 km) and the client badges them as nearby.
const NEARBY_RADIUS_KM = 100;

/**
 * GET /api/v1/explore/vets-nearby?lat=&lng=&limit=
 * Clinics sorted by real distance when device coordinates are provided
 * (clinics is the only table with lat/long), falling back to the viewer's
 * city and then to global rating order.
 */
export async function GET(req: NextRequest) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return errorResponse("UNAUTHORIZED", "Missing or invalid JWT", 401);

        const userId = parseInt(String(userIdRaw), 10);
        const { searchParams } = new URL(req.url);
        const limit = Math.min(20, parseInt(searchParams.get("limit") || "10", 10));

        const lat = parseFloat(searchParams.get("lat") || "");
        const lng = parseFloat(searchParams.get("lng") || "");
        const hasCoords =
            Number.isFinite(lat) && Number.isFinite(lng) &&
            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

        if (hasCoords) {
            // Haversine distance in SQL; LEAST/GREATEST clamps acos() input against
            // float rounding just outside [-1, 1]. Earth radius 6371 km matches the
            // client-side utility (src/utils/geo.ts) for parity.
            const result = await db.query(`
                SELECT * FROM (
                    SELECT ${CLINIC_FIELDS},
                        6371 * acos(LEAST(1.0, GREATEST(-1.0,
                            cos(radians($1)) * cos(radians(c.latitude)) * cos(radians(c.longitude) - radians($2))
                            + sin(radians($1)) * sin(radians(c.latitude))
                        ))) AS distance_km
                    FROM clinics c
                    WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL
                ) d
                WHERE d.distance_km <= $3
                ORDER BY d.distance_km ASC
                LIMIT $4
            `, [lat, lng, NEARBY_RADIUS_KM, limit]);

            if (result.rows.length > 0) {
                return NextResponse.json({ clinics: result.rows });
            }
        }

        // City fallback — match the viewer's city name against clinics.city (text)
        const viewerRes = await db.query(
            `SELECT ci.city_name FROM users u
             JOIN cities ci ON ci.city_id = u.city_id
             WHERE u.user_id = $1`,
            [userId]
        );
        const viewerCityName: string | null = viewerRes.rows[0]?.city_name ?? null;

        if (viewerCityName) {
            const cityRes = await db.query(`
                SELECT ${CLINIC_FIELDS}, NULL::float AS distance_km
                FROM clinics c
                WHERE LOWER(c.city) = LOWER($1)
                ORDER BY c.rating DESC NULLS LAST, c.total_reviews DESC NULLS LAST
                LIMIT $2
            `, [viewerCityName, limit]);

            if (cityRes.rows.length > 0) {
                return NextResponse.json({ clinics: cityRes.rows });
            }
        }

        // Global fallback — top-rated clinics anywhere
        const globalRes = await db.query(`
            SELECT ${CLINIC_FIELDS}, NULL::float AS distance_km
            FROM clinics c
            ORDER BY c.rating DESC NULLS LAST, c.total_reviews DESC NULLS LAST
            LIMIT $1
        `, [limit]);

        return NextResponse.json({ clinics: globalRes.rows });

    } catch (error) {
        console.error("V1 Vets Nearby error:", error);
        return errorResponse("INTERNAL_ERROR", "An unhandled exception occurred", 500);
    }
}
