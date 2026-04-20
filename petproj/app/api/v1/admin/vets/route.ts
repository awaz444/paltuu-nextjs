import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/utils/authServer";
import bcrypt from "bcryptjs";

/**
 * @swagger
 * /api/v1/admin/vets:
 *   get:
 *     summary: Admin view of all vets (V1)
 *     tags: [v1 Admin]
 *   post:
 *     summary: Admin create new vet (V1)
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
            // 1. Create User with SECURE HASHED password
            const tempPassword = Math.random().toString(36).slice(-10); // Random secure password
            const hashed = await bcrypt.hash(tempPassword, 10);

            const userRes = await db.query(`
                INSERT INTO users (name, email, password, role, created_at)
                VALUES ($1, $2, $3, 'vet', CURRENT_TIMESTAMP)
                ON CONFLICT (email) DO UPDATE SET role = 'vet'
                RETURNING user_id
            `, [name, email, hashed]);

            const userId = userRes.rows[0].user_id;

            // 2. Create Vet Profile
            const vetRes = await db.query(`
                INSERT INTO vets (user_id, clinic_name, license_number, profile_verified, created_at)
                VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
                RETURNING *
            `, [userId, clinic_name, license_number]);

            await db.query('COMMIT');
            
            // Note: In production, you would send an email to the vet here with their tempPassword
            return NextResponse.json({ 
                message: "Vet account created securely", 
                vet: vetRes.rows[0],
                temp_password: tempPassword // Returned once so admin can share it
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
