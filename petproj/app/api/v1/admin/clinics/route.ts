import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/utils/authServer";

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
            is_paltuu_partner, owner_email
        } = body;

        if (!name || !address) return NextResponse.json({ error: "Name and address required" }, { status: 400 });

        await db.query('BEGIN');
        try {
            let owner_id = null;
            if (owner_email) {
                let userResult = await db.query("SELECT user_id FROM users WHERE email = $1", [owner_email]);
                if (userResult.rows.length > 0) {
                    owner_id = userResult.rows[0].user_id;
                } else {
                    const res = await db.query("INSERT INTO users (name, email, password, role) VALUES ($1, $2, '12345', 'user') RETURNING user_id", [name, owner_email]);
                    owner_id = res.rows[0].user_id;
                }
            }

            const result = await db.query(`
                INSERT INTO clinics (
                    name, address, city, category,
                    google_maps_link, contact_number, whatsapp_number,
                    logo_url, operating_hours, discount_details,
                    website, rating, total_reviews,
                    is_paltuu_partner, owner_id
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
                RETURNING *
            `, [
                name, address, city || null, category || null,
                google_maps_link, contact_number, whatsapp_number,
                logo_url, operating_hours, discount_details,
                website || null, rating || null, total_reviews || null,
                is_paltuu_partner || false, owner_id
            ]);

            await db.query('COMMIT');
            return NextResponse.json(result.rows[0], { status: 201 });
        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
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
            is_paltuu_partner
        } = body;
        if (!clinic_id) return NextResponse.json({ error: "Clinic ID required" }, { status: 400 });

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
                is_paltuu_partner = COALESCE($14, is_paltuu_partner)
            WHERE clinic_id = $15
            RETURNING *
        `, [
            name, address, city, category,
            google_maps_link, contact_number, whatsapp_number,
            logo_url, operating_hours, discount_details,
            website, rating, total_reviews,
            is_paltuu_partner, clinic_id
        ]);

        if (result.rowCount === 0) return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        return NextResponse.json(result.rows[0]);
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
