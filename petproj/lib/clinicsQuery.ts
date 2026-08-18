import { db } from "@/db/index";
import { ensureClinicListingColumns } from "@/lib/clinicListing";

const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 50;

export interface ClinicsQueryInput {
    city?: string | null;
    category?: string | null;
    search?: string | null;
    verified?: boolean;
    partner?: boolean;
    sort?: string | null;
    lat?: number | null;
    lng?: number | null;
    listingType?: "clinic" | "home_vet" | null;
    /** Skip pagination and return every matching clinic — used for map pins. */
    all?: boolean;
    page?: number;
    limit?: number;
}

export interface ClinicsQueryResult {
    data: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    };
    cities: string[];
}

// Shared by the public GET /api/v1/clinics route and any server-rendered page
// that needs the same filtered/ranked clinic list without an extra HTTP
// round-trip (e.g. app/pet-care/page.tsx's initial SSR fetch).
export async function queryClinics(input: ClinicsQueryInput): Promise<ClinicsQueryResult> {
    const lat = input.lat ?? NaN;
    const lng = input.lng ?? NaN;
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
    const listingType = input.listingType === "clinic" || input.listingType === "home_vet"
        ? input.listingType
        : null;
    const all = input.all === true;
    const sort = input.sort ?? null;

    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, input.limit ?? DEFAULT_LIMIT));
    const offset = (page - 1) * limit;

    const hasListingCols = await ensureClinicListingColumns();

    // Always require a logo, and hide deactivated listings — neither shown publicly
    const conditions: string[] = ["c.logo_url IS NOT NULL", "c.is_active IS NOT FALSE"];
    const params: any[] = [];

    if (input.city) {
        params.push(input.city);
        conditions.push(`LOWER(c.city) = LOWER($${params.length})`);
    }

    if (input.category) {
        params.push(`%${input.category}%`);
        conditions.push(`LOWER(c.category) ILIKE $${params.length}`);
    }

    if (input.search) {
        params.push(`%${input.search}%`);
        const idx = params.length;
        conditions.push(
            hasListingCols
                ? `(c.name ILIKE $${idx} OR c.address ILIKE $${idx} OR c.city ILIKE $${idx} OR c.coverage_area ILIKE $${idx})`
                : `(c.name ILIKE $${idx} OR c.address ILIKE $${idx} OR c.city ILIKE $${idx})`
        );
    }

    if (listingType && hasListingCols) {
        params.push(listingType);
        conditions.push(`c.listing_type = $${params.length}`);
    }

    if (input.verified) {
        conditions.push(`c.is_verified = true`);
    }

    if (input.partner) {
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
    } else if (!sort && !listingType) {
        // Merged "all" view (no explicit type filter, no explicit sort):
        // rank by proximity band first, verified-first within a band, so a
        // close unverified listing still beats a far verified one — but
        // verification breaks ties among similarly-distant results. Falls
        // back to verified-first + rating when we don't have the user's
        // location at all.
        if (hasCoords) {
            params.push(lat);
            const latIdx = params.length;
            params.push(lng);
            const lngIdx = params.length;
            orderClause = `
                ORDER BY
                    CASE
                        WHEN c.latitude IS NULL OR c.longitude IS NULL THEN 2
                        WHEN 6371 * 2 * asin(sqrt(
                            power(sin(radians($${latIdx} - c.latitude) / 2), 2) +
                            cos(radians($${latIdx})) * cos(radians(c.latitude)) *
                            power(sin(radians($${lngIdx} - c.longitude) / 2), 2)
                        )) <= 5 THEN 0
                        WHEN 6371 * 2 * asin(sqrt(
                            power(sin(radians($${latIdx} - c.latitude) / 2), 2) +
                            cos(radians($${latIdx})) * cos(radians(c.latitude)) *
                            power(sin(radians($${lngIdx} - c.longitude) / 2), 2)
                        )) <= 15 THEN 1
                        ELSE 2
                    END ASC,
                    c.is_verified DESC NULLS LAST,
                    (c.latitude IS NULL OR c.longitude IS NULL),
                    6371 * 2 * asin(sqrt(
                        power(sin(radians($${latIdx} - c.latitude) / 2), 2) +
                        cos(radians($${latIdx})) * cos(radians(c.latitude)) *
                        power(sin(radians($${lngIdx} - c.longitude) / 2), 2)
                    )) ASC,
                    c.rating DESC NULLS LAST,
                    c.created_at DESC
            `;
        } else {
            orderClause = "ORDER BY c.is_verified DESC NULLS LAST, c.rating DESC NULLS LAST, c.created_at DESC";
        }
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
        WHERE logo_url IS NOT NULL AND city IS NOT NULL AND is_active IS NOT FALSE
        ORDER BY city
    `);

    return {
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
    };
}
