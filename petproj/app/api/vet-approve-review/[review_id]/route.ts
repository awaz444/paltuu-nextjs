import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

export async function POST(
    req: NextRequest,
    { params }: { params: { review_id: string } }
): Promise<NextResponse> {
    const client = createClient();
    const { review_id } = params;

    if (!review_id) {
        return NextResponse.json(
            { error: "Review ID is required" },
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        await client.connect();

        // Query to update the approved status
        const query = `
            UPDATE vet_reviews
            SET approved = true
            WHERE review_id = $1 AND approved = false
            RETURNING review_id, approved;
        `;
        const result = await client.query(query, [review_id]);

        // Check if any row was updated
        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: "No review found or already approved" },
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        return NextResponse.json(
            { message: "Review approved successfully", review: result.rows[0] },
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: (error as Error).message },
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        await client.end();
    }
}
