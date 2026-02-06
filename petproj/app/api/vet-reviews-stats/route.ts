import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../db/index";
import { getUserIdFromRequest } from "../../../utils/authServer";

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
                COUNT(*) AS approved_reviews_count
            FROM vet_reviews
            WHERE vet_id = $1;
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
export async function POST(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    
    // Authenticate user
    const authenticatedUserId = await getUserIdFromRequest(req);
    if (!authenticatedUserId) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401, headers: { "Content-Type": "application/json" } }
        );
    }

    // Parse the incoming request body to extract review data
    const { vet_id, rating, review_content, review_date } = await req.json();

    // Check if all required fields are provided
    if (!vet_id || !rating || !review_content || !review_date) {
        return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        await client.connect();

        // Insert the new review into the database
        const query = `
            INSERT INTO vet_reviews (vet_id, user_id, rating, review_content, review_date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING review_id;
        `;

        const values = [vet_id, authenticatedUserId, rating, review_content, review_date];

        const result = await client.query(query, values);

        // Get the inserted review ID from the result
        const review_id = result.rows[0].review_id;

        return NextResponse.json(
            { message: "Review posted successfully", review_id },
            { status: 201, headers: { "Content-Type": "application/json" } }
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