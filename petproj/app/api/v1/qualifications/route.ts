import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/qualifications:
 *   get:
 *     summary: Get all possible professional qualifications (V1)
 *     tags: [v1 Professional]
 */

export async function GET(req: NextRequest) {
    try {
        const result = await db.query('SELECT * FROM qualifications ORDER BY qualification_name ASC');
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("V1 Qualifications Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
