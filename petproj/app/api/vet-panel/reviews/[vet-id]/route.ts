import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../db/index";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const vet_id = req.nextUrl.pathname.split("/").pop();

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
                COUNT(*) FILTER (WHERE approved = true) AS total_approved_reviews,
                COUNT(*) FILTER (WHERE approved = false) AS total_pending_reviews,
                COALESCE(AVG(rating) FILTER (WHERE approved = true), 0) AS average_rating,
                MAX(review_date) FILTER (WHERE approved = true) AS most_recent_review_date
            FROM vet_reviews
            WHERE vet_id = $1;
        `;

        const result = await client.query(query, [vet_id]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "No reviews found for this vet" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const reviewStats = result.rows[0];

        const response = {
            total_approved_reviews: parseInt(reviewStats.total_approved_reviews, 10) || 0,
            total_pending_reviews: parseInt(reviewStats.total_pending_reviews, 10) || 0,
            average_rating: parseFloat(reviewStats.average_rating).toFixed(1), // Rounded to 1 decimal place
            most_recent_review_date: reviewStats.most_recent_review_date || null,
        };

        return NextResponse.json(response, {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    } finally {
        await client.end();
    }
}
