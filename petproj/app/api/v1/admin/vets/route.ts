import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/utils/authServer";
import bcrypt from "bcryptjs";

/**
 * @swagger
 * /api/v1/admin/vets:
 *   get:
 *     summary: Admin view of all vets (V1 Hardened)
 *     tags: [v1 Admin]
 *   post:
 *     summary: Admin create new vet (V1 Hardened)
 *     tags: [v1 Admin]
 *   patch:
 *     summary: Update vet profile (V1 Hardened)
 *     tags: [v1 Admin]
 *   delete:
 *     summary: Delete vet profile (V1 Hardened)
 *     tags: [v1 Admin]
 */

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
        }

        const query = `
            SELECT 
                v.*, u.name, u.email, u.profile_image_url, u.phone_number
            FROM vets v
            JOIN users u ON v.user_id = u.user_id
            ORDER BY v.created_at DESC
        `;

        const result = await db.query(query);
        return NextResponse.json(result.rows);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const adminUser = await getUserFromRequest(req);
        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { name, email, clinic_name, license_number } = body;

        if (!name || !email) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

        await db.query('BEGIN');
        try {
            const tempPassword = Math.random().toString(36).slice(-10);
            const hashed = await bcrypt.hash(tempPassword, 10);

            const userRes = await db.query(`
                INSERT INTO users (name, email, password, role, created_at)
                VALUES ($1, $2, $3, 'vet', CURRENT_TIMESTAMP)
                ON CONFLICT (email) DO UPDATE SET role = 'vet'
                RETURNING user_id
            `, [name, email, hashed]);

            const userId = userRes.rows[0].user_id;

            const vetRes = await db.query(`
                INSERT INTO vets (user_id, clinic_name, license_number, profile_verified, created_at)
                VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
                RETURNING *
            `, [userId, clinic_name, license_number]);

            await db.query('COMMIT');
            return NextResponse.json({ 
                message: "Vet account created", 
                vet: vetRes.rows[0],
                temp_password: tempPassword 
            }, { status: 201 });
        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }
    } catch (error) {
        console.error("V1 Admin Vet POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { vet_id, clinic_name, license_number, profile_verified } = await req.json();
        if (!vet_id) return NextResponse.json({ error: "Vet ID required" }, { status: 400 });

        const result = await db.query(`
            UPDATE vets SET 
                clinic_name = COALESCE($1, clinic_name),
                license_number = COALESCE($2, license_number),
                profile_verified = COALESCE($3, profile_verified)
            WHERE vet_id = $4
            RETURNING *
        `, [clinic_name, license_number, profile_verified, vet_id]);

        if (result.rowCount === 0) return NextResponse.json({ error: "Vet not found" }, { status: 404 });
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
        const vet_id = searchParams.get('vet_id');
        if (!vet_id) return NextResponse.json({ error: "Vet ID required" }, { status: 400 });

        await db.query('DELETE FROM vets WHERE vet_id = $1', [vet_id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
