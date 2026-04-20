import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { validate } from "@/utils/validation";

/**
 * @swagger
 * /api/v1/rescue/shelters:
 *   post:
 *     summary: Register a new rescue shelter (V1)
 *     tags: [v1 Community]
 */

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json(); // Simplfying for V1 JSON instead of Formidable if possible, or using standard FormData
        const { shelterName, address, description, capacity, accountTitle, iban, bankName } = body;

        const validation = validate({ shelterName, address }, {
            shelterName: { required: true },
            address: { required: true }
        });

        if (!validation.success) return NextResponse.json({ errors: validation.errors }, { status: 400 });

        await db.query('BEGIN');
        try {
            // 1. Create Shelter
            const shelterRes = await db.query(`
                INSERT INTO rescue_shelters (user_id, shelter_name, address, description, capacity, approved, created_at)
                VALUES ($1, $2, $3, $4, $5, false, CURRENT_TIMESTAMP)
                RETURNING shelter_id
            `, [userId, shelterName, address, description, capacity]);

            const shelterId = shelterRes.rows[0].shelter_id;

            // 2. Add Bank Info
            await db.query(`
                INSERT INTO shelter_bank_info (shelter_id, account_title, iban, bank_name)
                VALUES ($1, $2, $3, $4)
            `, [shelterId, accountTitle, iban, bankName]);

            await db.query('COMMIT');
            return NextResponse.json({ success: true, shelter_id: shelterId }, { status: 201 });

        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Shelter POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
