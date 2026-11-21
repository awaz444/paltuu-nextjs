import { NextResponse } from "next/server";
import { VET_QUALIFICATIONS } from "@/lib/vetQualifications";

/**
 * @swagger
 * /api/v1/qualifications:
 *   get:
 *     summary: Get all possible professional qualifications (V1)
 *     tags: [v1 Professional]
 */

// Served from code: production has no qualifications table (see lib/vetQualifications.ts).
export async function GET() {
    return NextResponse.json(VET_QUALIFICATIONS);
}
