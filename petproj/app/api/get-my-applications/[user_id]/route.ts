import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

export async function GET(
    req: NextRequest,
    { params }: { params: { user_id: string } }
): Promise<NextResponse> {
    const client = createClient();
    const { user_id } = params;

    if (!user_id) {
        return NextResponse.json(
            { error: "User ID is required" },
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        await client.connect();

        // Query to get all foster applications for the user
        const fosterQuery = `
            SELECT 
                'foster' AS application_type,
                foster_id AS application_id,
                pet_id,
                status,
                created_at
            FROM foster_applications
            WHERE user_id = $1;
        `;
        const fosterApplications = await client.query(fosterQuery, [user_id]);

        // Query to get all adoption applications for the user
        const adoptionQuery = `
            SELECT 
                'adoption' AS application_type,
                adoption_id AS application_id,
                pet_id,
                status,
                created_at
            FROM adoption_applications
            WHERE user_id = $1;
        `;
        const adoptionApplications = await client.query(adoptionQuery, [user_id]);

        // Combine both application results
        const combinedApplications = [
            ...fosterApplications.rows,
            ...adoptionApplications.rows,
        ];

        return NextResponse.json(
            { user_id, applications: combinedApplications },
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
