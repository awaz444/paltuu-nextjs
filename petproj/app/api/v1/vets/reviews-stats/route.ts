import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const vetId = searchParams.get("vet_id");

        if (!vetId) {
            return NextResponse.json({ error: "Vet ID required" }, { status: 400 });
        }

        const result = await db.query(`
            SELECT
                COALESCE(AVG(rating), 0) as average_rating,
                COUNT(*) as reviews_count
            FROM vet_reviews
            WHERE vet_id = $1
        `, [vetId]);

        return NextResponse.json({
            average_rating: parseFloat(result.rows[0].average_rating),
            reviews_count: parseInt(result.rows[0].reviews_count)
        });

    } catch (error) {
        console.error("Error fetching vet review stats:", error);
        return NextResponse.json({
            average_rating: 0,
            reviews_count: 0
        });
    }
}
