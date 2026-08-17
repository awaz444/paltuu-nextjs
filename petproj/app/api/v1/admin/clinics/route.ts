import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/utils/authServer";
import { ensureClinicListingColumns } from "@/lib/clinicListing";

// ─── Slugs (verified clinics only) ─────────────────────────────────────────

function slugify(text: string): string {
    return (text || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function generateUniqueClinicSlug(
    client: { query: typeof db.query },
    name: string,
    city: string | null,
    excludeClinicId?: string | number
): Promise<string> {
    const base = slugify(name) || "clinic";
    const withCity = city ? `${base}-${slugify(city)}` : base;

    let candidate = withCity;
    let suffix = 2;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const existing = await client.query(
            excludeClinicId
                ? `SELECT clinic_id FROM clinics WHERE slug = $1 AND clinic_id != $2`
                : `SELECT clinic_id FROM clinics WHERE slug = $1`,
            excludeClinicId ? [candidate, excludeClinicId] : [candidate]
        );
        if (existing.rowCount === 0) return candidate;
        candidate = `${withCity}-${suffix}`;
        suffix += 1;
    }
}

/**
 * @swagger
 * /api/v1/admin/clinics:
 *   get:
 *     summary: Admin view of all clinics (V1 Hardened)
 *     tags: [v1 Admin]
 *   post:
 *     summary: Create new clinic (V1 Hardened)
 *     tags: [v1 Admin]
 *   patch:
 *     summary: Update clinic (V1 Hardened)
 *     tags: [v1 Admin]
 *   delete:
 *     summary: Delete clinic (V1 Hardened)
 *     tags: [v1 Admin]
 */

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const result = await db.query(`
            SELECT c.*, u.email as owner_email 
            FROM clinics c
            LEFT JOIN users u ON c.owner_id = u.user_id
            ORDER BY c.created_at DESC;
        `);
        return NextResponse.json(result.rows);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json();
        const {
            name, address, city, category,
            google_maps_link, contact_number, whatsapp_number,
            logo_url, operating_hours, discount_details,
            website, rating, total_reviews,
            is_paltuu_partner, is_verified, is_active, owner_email,
            listing_type: listingTypeRaw, coverage_area: coverageAreaRaw,
        } = body;

        const listing_type = listingTypeRaw === "home_vet" ? "home_vet" : "clinic";
        const coverage_area = typeof coverageAreaRaw === "string" && coverageAreaRaw.trim()
            ? coverageAreaRaw.trim()
            : null;
        const resolvedAddress = listing_type === "home_vet" ? "" : address;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }
        if (listing_type === "home_vet" && !coverage_area) {
            return NextResponse.json({ error: "Name and coverage area required" }, { status: 400 });
        }
        if (listing_type === "clinic" && !resolvedAddress) {
            return NextResponse.json({ error: "Name and address required" }, { status: 400 });
        }

        await ensureClinicListingColumns();

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            let owner_id = null;
            if (owner_email) {
                let userResult = await client.query("SELECT user_id FROM users WHERE email = $1", [owner_email]);
                if (userResult.rows.length > 0) {
                    owner_id = userResult.rows[0].user_id;
                } else {
                    const res = await client.query("INSERT INTO users (name, email, password, role) VALUES ($1, $2, '12345', 'user') RETURNING user_id", [name, owner_email]);
                    owner_id = res.rows[0].user_id;
                }
            }

            const slug = is_verified
                ? await generateUniqueClinicSlug(client, name, city || null)
                : null;

            const result = await client.query(`
                INSERT INTO clinics (
                    name, address, city, category,
                    google_maps_link, contact_number, whatsapp_number,
                    logo_url, operating_hours, discount_details,
                    website, rating, total_reviews,
                    is_paltuu_partner, is_verified, is_active, owner_id,
                    listing_type, coverage_area, slug
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
                RETURNING *
            `, [
                name, resolvedAddress, city || null, category || null,
                google_maps_link, contact_number, whatsapp_number,
                logo_url, operating_hours, discount_details,
                website || null, rating || null, total_reviews || null,
                is_paltuu_partner || false, is_verified || false,
                is_active === undefined ? true : is_active, owner_id,
                listing_type, coverage_area, slug,
            ]);

            await client.query('COMMIT');
            return NextResponse.json(result.rows[0], { status: 201 });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json();
        const {
            clinic_id, name, address, city, category,
            google_maps_link, contact_number, whatsapp_number,
            logo_url, operating_hours, discount_details,
            website, rating, total_reviews,
            is_paltuu_partner, is_verified, is_active,
            listing_type: listingTypeRaw, coverage_area: coverageAreaRaw,
        } = body;
        if (!clinic_id) return NextResponse.json({ error: "Clinic ID required" }, { status: 400 });

        await ensureClinicListingColumns();

        const listing_type = listingTypeRaw === "home_vet" || listingTypeRaw === "clinic"
            ? listingTypeRaw
            : null;
        const coverage_area = coverageAreaRaw === undefined
            ? null
            : (typeof coverageAreaRaw === "string" && coverageAreaRaw.trim() ? coverageAreaRaw.trim() : null);
        const resolvedAddress = listing_type === "home_vet" ? "" : address;

        const result = await db.query(`
            UPDATE clinics SET
                name              = COALESCE($1, name),
                address           = COALESCE($2, address),
                city              = COALESCE($3, city),
                category          = COALESCE($4, category),
                google_maps_link  = COALESCE($5, google_maps_link),
                contact_number    = COALESCE($6, contact_number),
                whatsapp_number   = COALESCE($7, whatsapp_number),
                logo_url          = COALESCE($8, logo_url),
                operating_hours   = COALESCE($9, operating_hours),
                discount_details  = COALESCE($10, discount_details),
                website           = COALESCE($11, website),
                rating            = COALESCE($12, rating),
                total_reviews     = COALESCE($13, total_reviews),
                is_paltuu_partner = COALESCE($14, is_paltuu_partner),
                is_verified       = COALESCE($15, is_verified),
                is_active         = COALESCE($16, is_active),
                listing_type      = COALESCE($17, listing_type),
                coverage_area     = COALESCE($18, coverage_area)
            WHERE clinic_id = $19
            RETURNING *
        `, [
            name, resolvedAddress, city, category,
            google_maps_link, contact_number, whatsapp_number,
            logo_url, operating_hours, discount_details,
            website, rating, total_reviews,
            is_paltuu_partner, is_verified, is_active,
            listing_type, coverage_area, clinic_id
        ]);

        if (result.rowCount === 0) return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        let clinic = result.rows[0];

        // Slugs exist only for verified clinics — assign one the moment a
        // clinic becomes verified, and clear it if verification is revoked.
        if (clinic.is_verified && !clinic.slug) {
            const slug = await generateUniqueClinicSlug(db, clinic.name, clinic.city, clinic.clinic_id);
            const slugResult = await db.query(
                `UPDATE clinics SET slug = $1 WHERE clinic_id = $2 RETURNING *`,
                [slug, clinic.clinic_id]
            );
            clinic = slugResult.rows[0];
        } else if (!clinic.is_verified && clinic.slug) {
            const slugResult = await db.query(
                `UPDATE clinics SET slug = NULL WHERE clinic_id = $1 RETURNING *`,
                [clinic.clinic_id]
            );
            clinic = slugResult.rows[0];
        }

        return NextResponse.json(clinic);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const clinic_id = searchParams.get('clinic_id');
        if (!clinic_id) return NextResponse.json({ error: "Clinic ID required" }, { status: 400 });

        await db.query('DELETE FROM clinics WHERE clinic_id = $1', [clinic_id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
