import { createClient } from "../../../../../db/index";
import { NextRequest, NextResponse } from "next/server";

// GET method to fetch approved reviews for a specific vet_id
export async function GET(
    req: NextRequest,
    { params }: { params: { vet_id: string } }
): Promise<NextResponse> {
    const client = createClient();
    const { vet_id } = params;

    try {
        await client.connect();
        const result = await client.query(
                    `
            SELECT 
                vr.review_id, 
                vr.user_id, 
                vr.rating, 
                vr.review_content, 
                vr.review_date, 
                u.name AS user_name, 
                u.profile_image_url AS user_image_url
            FROM vet_reviews vr
            JOIN users u ON vr.user_id = u.user_id
            WHERE vr.vet_id = $1 AND vr.approved = true
            ORDER BY vr.review_date DESC
        `,
                    [vet_id]
                );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { message: "No approved reviews found for this vet" },
                { status: 404 }
            );
        }

        return NextResponse.json(result.rows, {
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
