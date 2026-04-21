import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/vets/get-id:
 *   get:
 *     summary: Get vet_id for a given user_id (V1)
 *     tags: [v1 Professional]
 */

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("user_id");

        if (!userId) return NextResponse.json({ error: "user_id is required" }, { status: 400 });

        const result = await db.query('SELECT vet_id FROM vets WHERE user_id = $1', [userId]);

        if ((result.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "Vet profile not found" }, { status: 404 });
        }

        return NextResponse.json({ vet_id: result.rows[0].vet_id });

    } catch (error) {
        console.error("V1 Get Vet ID error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
