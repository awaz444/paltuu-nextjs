import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

export async function DELETE(
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

        // Query to delete the review
        const query = `
            DELETE FROM vet_reviews
            WHERE review_id = $1
            RETURNING review_id;
        `;
        const result = await client.query(query, [review_id]);

        // Check if any row was deleted
        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: "Review not found" },
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        return NextResponse.json(
            { message: "Review rejected and deleted successfully", review_id: result.rows[0].review_id },
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
