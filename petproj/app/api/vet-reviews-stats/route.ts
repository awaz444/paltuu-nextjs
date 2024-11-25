import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../db/index";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    // Extract query parameter
    const vet_id = req.nextUrl.searchParams.get("vet_id");

    if (!vet_id) {
        return NextResponse.json(
            { error: "Vet ID is required" },
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    try {
        await client.connect();

        const query = `
            SELECT 
                AVG(rating) AS average_rating,
                COUNT(*) FILTER (WHERE approved = true) AS approved_reviews_count
            FROM vet_reviews
            WHERE vet_id = $1 AND approved = true;
        `;

        const result = await client.query(query, [vet_id]);

        // Handle the possibility of no rows being returned
        const row = result.rows[0] || { average_rating: null, approved_reviews_count: 0 };

        return NextResponse.json(
            {
                vet_id,
                average_rating: row.average_rating ? parseFloat(row.average_rating) : 0,
                approved_reviews_count: row.approved_reviews_count || 0,
            },
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: (error as Error).message },
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    } finally {
        await client.end();
    }
}
