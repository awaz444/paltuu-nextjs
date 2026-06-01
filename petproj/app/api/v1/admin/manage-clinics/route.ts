import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/admin/manage-clinics:
 *   get:
 *     summary: Get all clinics with vet count and linked vet details
 *     tags: [v1 Admin]
 *   patch:
 *     summary: Update clinic info including logo
 *     tags: [v1 Admin]
 *   delete:
 *     summary: Delete a clinic
 *     tags: [v1 Admin]
 */

// ─── GET — All clinics with aggregated vet info ────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== "admin")
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const search   = searchParams.get("search") || "";
        const city     = searchParams.get("city") || "";
        const page     = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") || "20"));
        const offset   = (page - 1) * pageSize;

        const conditions: string[] = [];
        const params: any[] = [];

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(c.name ILIKE $${params.length} OR c.address ILIKE $${params.length})`);
        }
        if (city) {
            params.push(city);
            conditions.push(`LOWER(c.city) = LOWER($${params.length})`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        // Count query
        const countResult = await db.query(
            `SELECT COUNT(*) FROM clinics c ${where}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Main query with vet count
        const dataParams = [...params, pageSize, offset];
        const result = await db.query(`
            SELECT
                c.*,
                u.email  AS owner_email,
                COUNT(cv.vet_id)::int AS vet_count
            FROM clinics c
            LEFT JOIN users u      ON c.owner_id = u.user_id
            LEFT JOIN clinic_vets cv ON c.clinic_id = cv.clinic_id
            ${where}
            GROUP BY c.clinic_id, u.email
            ORDER BY c.created_at DESC
            LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
        `, dataParams);

        return NextResponse.json({ clinics: result.rows, total, page, pageSize });
    } catch (error) {
        console.error("manage-clinics GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// ─── PATCH — Update clinic fields ─────────────────────────────────────────
export async function PATCH(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== "admin")
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json();
        const {
            clinic_id, name, address, city, category,
            google_maps_link, contact_number, whatsapp_number,
            logo_url, operating_hours, discount_details,
            website, rating, total_reviews, is_paltuu_partner,
            owner_email,
        } = body;

        if (!clinic_id)
            return NextResponse.json({ error: "clinic_id required" }, { status: 400 });

        await db.query("BEGIN");
        try {
            // Resolve owner_id from email if provided
            let owner_id: number | null = null;
            if (owner_email !== undefined) {
                if (owner_email) {
                    const ur = await db.query(
                        "SELECT user_id FROM users WHERE email = $1",
                        [owner_email]
                    );
                    owner_id = ur.rows[0]?.user_id ?? null;
                } else {
                    owner_id = null;
                }
            }

            const ownerUpdate = owner_email !== undefined
                ? `, owner_id = $16`
                : "";

            const baseParams = [
                name, address, city, category,
                google_maps_link, contact_number, whatsapp_number,
                logo_url, operating_hours, discount_details,
                website,
                rating   !== undefined ? rating   : null,
                total_reviews !== undefined ? total_reviews : null,
                is_paltuu_partner,
                clinic_id,
            ];

            if (owner_email !== undefined) baseParams.push(owner_id as any);

            const result = await db.query(`
                UPDATE clinics SET
                    name              = COALESCE($1,  name),
                    address           = COALESCE($2,  address),
                    city              = COALESCE($3,  city),
                    category          = COALESCE($4,  category),
                    google_maps_link  = COALESCE($5,  google_maps_link),
                    contact_number    = COALESCE($6,  contact_number),
                    whatsapp_number   = COALESCE($7,  whatsapp_number),
                    logo_url          = $8,
                    operating_hours   = COALESCE($9,  operating_hours),
                    discount_details  = COALESCE($10, discount_details),
                    website           = COALESCE($11, website),
                    rating            = COALESCE($12, rating),
                    total_reviews     = COALESCE($13, total_reviews),
                    is_paltuu_partner = COALESCE($14, is_paltuu_partner)
                    ${ownerUpdate}
                WHERE clinic_id = $15
                RETURNING *
            `, baseParams);

            if (result.rowCount === 0) {
                await db.query("ROLLBACK");
                return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
            }

            await db.query("COMMIT");
            return NextResponse.json(result.rows[0]);
        } catch (e) {
            await db.query("ROLLBACK");
            throw e;
        }
    } catch (error) {
        console.error("manage-clinics PATCH error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// ─── DELETE — Remove clinic ────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== "admin")
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const clinic_id = searchParams.get("clinic_id");
        if (!clinic_id)
            return NextResponse.json({ error: "clinic_id required" }, { status: 400 });

        await db.query("DELETE FROM clinics WHERE clinic_id = $1", [clinic_id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("manage-clinics DELETE error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
