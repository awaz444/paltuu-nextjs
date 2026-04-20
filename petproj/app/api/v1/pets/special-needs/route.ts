import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/pets/special-needs:
 *   get:
 *     summary: Fetch special needs for a pet (V1 Hardened)
 *     tags: [v1 Pets]
 *   post:
 *     summary: Update special needs for a pet (V1 Hardened)
 *     tags: [v1 Pets]
 */

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const petId = searchParams.get('pet_id');
        if (!petId) return NextResponse.json({ error: "Pet ID required" }, { status: 400 });

        const result = await db.query(`
            SELECT need_id, special_need 
            FROM rescue_special_needs 
            WHERE pet_id = $1 
            ORDER BY need_id ASC
        `, [petId]);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("V1 Special Needs GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { pet_id, special_needs } = await req.json();
        if (!pet_id || !Array.isArray(special_needs)) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        // 1. Ownership Check
        const petCheck = await db.query('SELECT owner_id FROM pets WHERE pet_id = $1', [pet_id]);
        if (petCheck.rowCount === 0) return NextResponse.json({ error: "Pet not found" }, { status: 404 });
        if (petCheck.rows[0].owner_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // 2. Atomic Update
        await db.query('DELETE FROM rescue_special_needs WHERE pet_id = $1', [pet_id]);

        for (const need of special_needs) {
            if (need?.trim()) {
                await db.query(`
                    INSERT INTO rescue_special_needs (pet_id, special_need)
                    VALUES ($1, $2)
                `, [pet_id, need.trim()]);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("V1 Special Needs POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
