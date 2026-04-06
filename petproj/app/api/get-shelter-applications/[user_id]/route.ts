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

        // First, get the shelter_id for this user
        const shelterQuery = `
            SELECT shelter_id FROM rescue_shelters WHERE user_id = $1
        `;
        const shelterResult = await client.query(shelterQuery, [user_id]);
        
        if (shelterResult.rows.length === 0) {
            return NextResponse.json(
                { error: "No shelter found for this user" },
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        const shelterId = shelterResult.rows[0].shelter_id;

        // Query to get all adoption applications for pets owned by this shelter
        const adoptionQuery = `
            SELECT 
                'adoption' AS application_type,
                aa.adoption_id AS application_id,
                aa.pet_id,
                aa.status,
                aa.created_at,
                aa.adopter_name,
                aa.adopter_address,
                aa.age_of_youngest_child,
                aa.other_pets_details,
                aa.other_pets_neutered,
                aa.has_secure_outdoor_area,
                aa.pet_sleep_location,
                aa.pet_left_alone,
                aa.additional_details,
                aa.agree_to_terms,
                aa.delivery,
                p.pet_name,
                p.pet_breed,
                c.city_name,
                p.area,
                p.age_months,
                p.contact_number,
                p.adoption_status,
                pi.image_url
            FROM adoption_applications AS aa
            JOIN pets AS p ON aa.pet_id = p.pet_id
            JOIN cities AS c ON p.city_id = c.city_id
            LEFT JOIN pet_images AS pi ON p.pet_id = pi.pet_id AND pi.order = 1
            WHERE p.shelter_id = $1
            ORDER BY aa.created_at DESC;
        `;
        const adoptionApplications = await client.query(adoptionQuery, [shelterId]);

        // Note: Only adoption applications are supported based on the current schema
        // Foster applications table doesn't exist in the current schema
        
        // Return only adoption applications
        const combinedApplications = [
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
