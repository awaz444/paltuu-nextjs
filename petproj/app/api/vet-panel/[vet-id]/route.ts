import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

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
                -- Personal Info
                v.vet_id, 
                v.user_id AS vet_user_id, 
                v.clinic_name, 
                v.location, 
                v.minimum_fee, 
                v.contact_details, 
                v.profile_verified, 
                v.created_at, 
                v.bio,
                u.name AS vet_name, 
                u.dob, 
                u.email, 
                u.profile_image_url AS vet_profile_image_url,
                c.city_name AS city,

                -- Reviews Summary
                COUNT(vr.review_id) AS total_reviews, 
                COALESCE(AVG(vr.rating), 0) AS average_rating,

                -- Qualifications
                ARRAY_AGG(DISTINCT q.qualification_name) AS qualifications,

                -- Specializations
                ARRAY_AGG(DISTINCT pc.category_name) AS specializations,

                -- Availability
                JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
                    'day_of_week', va.day_of_week,
                    'start_time', va.start_time,
                    'end_time', va.end_time
                )) AS schedules
            FROM vets v
            JOIN users u ON v.user_id = u.user_id
            JOIN cities c ON u.city_id = c.city_id
            LEFT JOIN vet_reviews vr ON v.vet_id = vr.vet_id AND vr.approved = true
            LEFT JOIN vet_qualifications vq ON v.vet_id = vq.vet_id
            LEFT JOIN qualifications q ON vq.qualification_id = q.qualification_id
            LEFT JOIN vet_specializations vs ON v.vet_id = vs.vet_id
            LEFT JOIN pet_category pc ON vs.category_id = pc.category_id
            LEFT JOIN vet_availability va ON v.vet_id = va.vet_id
            WHERE v.vet_id = $1
            GROUP BY v.vet_id, u.user_id, c.city_name;
        `;

        const result = await client.query(query, [vet_id]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Vet not found" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const vet = result.rows[0];

        // Structure response
        const response = {
            personal_info: {
                vet_id: vet.vet_id,
                user_id: vet.vet_user_id,
                clinic_name: vet.clinic_name,
                location: vet.location,
                minimum_fee: vet.minimum_fee,
                contact_details: vet.contact_details,
                profile_verified: vet.profile_verified,
                created_at: vet.created_at,
                bio: vet.bio,
                vet_name: vet.vet_name,
                dob: vet.dob,
                email: vet.email,
                profile_image_url: vet.vet_profile_image_url,
                city: vet.city,
            },
            reviews_summary: {
                average_rating: Number(vet.average_rating).toFixed(1), // Rounded to 1 decimal place
                total_reviews: vet.total_reviews,
            },
            qualifications: vet.qualifications.filter(Boolean), // Remove nulls
            specializations: vet.specializations.filter(Boolean), // Remove nulls
            schedules: vet.schedules.filter(Boolean), // Remove nulls
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
