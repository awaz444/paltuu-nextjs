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
                -- Vet details
                v.vet_id, 
                v.user_id AS vet_user_id, 
                cl.name AS clinic_name, 
                cl.address AS location, 
                v.clinic_id,
                cl.is_paltuu_partner,
                cl.google_maps_link,
                v.minimum_fee, 
                v.contact_details, 
                v.contact_details, 
                -- v.profile_verified, -- Removed
                v.created_at, 
                v.bio,
                cl.whatsapp_number AS clinic_whatsapp,
                -- v.clinic_email, -- Removed as not in new schema for clinics or vets? keeping commented just in case

                -- User details (vet)
                u.name AS vet_name, 
                u.dob, 
                u.city_id, 
                u.email, 
                u.profile_image_url AS vet_profile_image_url,

                -- City details
                c.city_name AS city_name,

                -- Vet reviews
                vr.review_id, 
                vr.rating, 
                vr.review_content, 
                vr.review_date, 
                u_review.name AS review_maker_name,
                u_review.profile_image_url AS review_maker_profile_image_url,

                -- Vet specializations
                vc.category_id AS specialization_category_id, 
                pc.category_name AS specialization_category_name,

                -- Vet qualifications
                vq.qualification_id, 
                vq.year_acquired, 
                vq.note AS qualification_note, 
                q.qualification_name
            FROM vets v
            JOIN users u ON v.user_id = u.user_id
            JOIN cities c ON u.city_id = c.city_id
            LEFT JOIN clinics cl ON v.clinic_id = cl.clinic_id
            LEFT JOIN vet_reviews vr ON v.vet_id = vr.vet_id
            LEFT JOIN users u_review ON vr.user_id = u_review.user_id
            LEFT JOIN vet_specializations vc ON v.vet_id = vc.vet_id
            LEFT JOIN pet_category pc ON vc.category_id = pc.category_id
            LEFT JOIN vet_qualifications vq ON v.vet_id = vq.vet_id
            LEFT JOIN qualifications q ON vq.qualification_id = q.qualification_id
            WHERE v.vet_id = $1 AND v.is_active = true;
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

        // Extract rows and organize data
        const vetData = result.rows;
        const vet = vetData[0];

        // Availability removed from query as per provided schema (checked schema.txt, no vet_availability table shown? Wait, schema.txt might be partial or I missed it.
        // The user said "we have changed the schema.txt a little bit".
        // I should check if `vet_availability` is in schema.txt.
        // schema.txt DOES NOT show `vet_availability`. It shows `vets` has `schedule text`.
        // So I should remove the join with `vet_availability` and use `v.schedule`.

        const reviews = vetData
            .filter((row) => row.review_id)
            .map((row) => ({
                review_id: row.review_id,
                rating: row.rating,
                review_content: row.review_content,
                review_date: row.review_date,
                review_maker_name: row.review_maker_name,
                review_maker_profile_image_url:
                    row.review_maker_profile_image_url,
            }));

        const specializations = vetData
            .filter((row) => row.specialization_category_id)
            .map((row) => ({
                category_id: row.specialization_category_id,
                category_name: row.specialization_category_name,
            }));

        const qualifications = vetData
            .filter((row) => row.qualification_id)
            .map((row) => ({
                qualification_id: row.qualification_id,
                year_acquired: row.year_acquired,
                qualification_note: row.qualification_note,
                qualification_name: row.qualification_name,
            }));

        // Structure response
        const response = {
            vet_id: vet.vet_id,
            user_id: vet.vet_user_id,
            clinic_id: vet.clinic_id,
            clinic_name: vet.clinic_name,
            is_paltuu_partner: vet.is_paltuu_partner,
            clinic_whatsapp: vet.clinic_whatsapp,
            google_maps_link: vet.google_maps_link,
            location: vet.location,
            minimum_fee: vet.minimum_fee,
            contact_details: vet.contact_details,
            // profile_verified: vet.profile_verified, // Removed as column does not exist
            created_at: vet.created_at,
            bio: vet.bio,
            vet_name: vet.vet_name,
            dob: vet.dob,
            email: vet.email,
            profile_image_url: vet.vet_profile_image_url,
            city: vet.city_name,
            schedule: vet.schedule, // Added new field
            reviews,
            specializations,
            qualifications,
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
