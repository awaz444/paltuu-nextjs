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

        // Query to get all foster applications for the user with detailed pet info
        const fosterQuery = `
            SELECT 
                'foster' AS application_type,
                fa.foster_id AS application_id,
                fa.pet_id,
                fa.status,
                fa.created_at,
                p.pet_name,
                p.pet_breed,
                c.city_name,
                p.area,
                p.age,
                p.adoption_status,
                pi.image_url
            FROM foster_applications AS fa
            JOIN pets AS p ON fa.pet_id = p.pet_id
            JOIN cities AS c ON p.city_id = c.city_id
            LEFT JOIN pet_images AS pi ON p.pet_id = pi.pet_id AND pi.order = 1
            WHERE fa.user_id = $1;
        `;
        const fosterApplications = await client.query(fosterQuery, [user_id]);

        // Query to get all adoption applications for the user
        const adoptionQuery = `
            SELECT 
                'adoption' AS application_type,
                aa.adoption_id AS application_id,
                aa.pet_id,
                aa.status,
                aa.created_at,
                p.pet_name,
                p.pet_breed,
                c.city_name,
                p.area,
                p.age,
                p.adoption_status,
                pi.image_url
            FROM adoption_applications AS aa
            JOIN pets AS p ON aa.pet_id = p.pet_id
            JOIN cities AS c ON p.city_id = c.city_id
            LEFT JOIN pet_images AS pi ON p.pet_id = pi.pet_id AND pi.order = 1
            WHERE aa.user_id = $1;
        `;
        const adoptionApplications = await client.query(adoptionQuery, [
            user_id,
        ]);

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
            {
                error: "Internal Server Error",
                message: (error as Error).message,
            },
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        await client.end();
    }
}
