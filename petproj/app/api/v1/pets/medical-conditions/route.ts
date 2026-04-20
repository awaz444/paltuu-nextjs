import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/pets/medical-conditions:
 *   get:
 *     summary: Fetch medical conditions for a pet (V1 Hardened)
 *     tags: [v1 Pets]
 *   post:
 *     summary: Update medical conditions for a pet (V1 Hardened)
 *     tags: [v1 Pets]
 */

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const petId = searchParams.get('pet_id');
        if (!petId) return NextResponse.json({ error: "Pet ID required" }, { status: 400 });

        const result = await db.query(`
            SELECT condition_id, condition, treatment_cost, treated 
            FROM rescue_medical_conditions 
            WHERE pet_id = $1 
            ORDER BY condition_id ASC
        `, [petId]);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("V1 Medical Conditions GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { pet_id, medical_conditions } = await req.json();
        if (!pet_id || !Array.isArray(medical_conditions)) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        // 1. Ownership Check
        const petCheck = await db.query('SELECT owner_id FROM pets WHERE pet_id = $1', [pet_id]);
        if (petCheck.rowCount === 0) return NextResponse.json({ error: "Pet not found" }, { status: 404 });
        if (petCheck.rows[0].owner_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // 2. Atomic Update
        await db.query('DELETE FROM rescue_medical_conditions WHERE pet_id = $1', [pet_id]);

        for (const cond of medical_conditions) {
            if (cond.condition?.trim()) {
                await db.query(`
                    INSERT INTO rescue_medical_conditions (pet_id, condition, treatment_cost, treated)
                    VALUES ($1, $2, $3, $4)
                `, [pet_id, cond.condition.trim(), cond.treatment_cost || null, cond.treated || false]);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("V1 Medical Conditions POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
