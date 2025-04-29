import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../db/index";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    
    // Extracting rescue_id from the URL path
    const rescue_id = req.url.split('/').pop();  // Get the last part of the URL, which is the rescue_id

    if (!rescue_id || isNaN(Number(rescue_id))) {
        return NextResponse.json(
            { error: "Invalid or missing rescue_id" },
            { status: 400 }
        );
    }

    try {
        await client.connect();

        const query = `
        SELECT 
            rp.rescue_id,
            rp.rescue_org_id,
            rp.pet_name,
            rp.pet_type,
            rp.approximate_age_lower,
            rp.approximate_age_higher,
            rp.description,
            rp.rescue_story,
            rp.rescue_date,
            rp.urgency_level,
            rp.status,
            rp.current_location,
            rp.sex,
            rp.adoption_fee,
            rp.foster_available,
            rp.vaccinated,
            rp.neutered,
            rp.temperament,

            -- Aggregate medical conditions
            COALESCE(
                JSON_AGG(
                    DISTINCT JSONB_BUILD_OBJECT(
                        'condition', rc.condition,
                        'treatment_cost', rc.treatment_cost,
                        'treated', rc.treated
                    )
                ) FILTER (WHERE rc.condition IS NOT NULL),
                '[]'
            ) AS medical_conditions,

            -- Aggregate images
            COALESCE(
                ARRAY_AGG(DISTINCT ri.image_url) FILTER (WHERE ri.image_url IS NOT NULL),
                '{}'
            ) AS images,

            -- Special needs
            COALESCE(
                ARRAY_AGG(DISTINCT rsn.special_need) FILTER (WHERE rsn.special_need IS NOT NULL),
                '{}'
            ) AS special_needs,

            -- Shelter info
            JSONB_BUILD_OBJECT(
                'id', rs.shelter_id,
                'name', rs.shelter_name,
                'profilePicture', rs.logo_url,
                'location', rs.address,
                'contactInfo', u.phone_number,
                'verified', rs.approved
            ) AS shelter

        FROM rescue_pets rp

        LEFT JOIN rescue_medical_conditions rc ON rp.rescue_id = rc.rescue_id
        LEFT JOIN rescue_images ri ON rp.rescue_id = ri.rescue_id
        LEFT JOIN rescue_special_needs rsn ON rp.rescue_id = rsn.rescue_id
        LEFT JOIN rescue_shelters rs ON rp.rescue_org_id = rs.shelter_id
        LEFT JOIN users u ON u.user_id = rs.user_id
        LEFT JOIN cities ci ON ci.city_id = u.city_id

        WHERE rp.rescue_id = $1  -- Query for a specific rescue_id

        GROUP BY rp.rescue_id, rs.shelter_id, u.phone_number, ci.city_name

        ORDER BY rp.rescue_date DESC;
        `;

        const result = await client.query(query, [rescue_id]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Pet not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(result.rows[0], {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);

        return NextResponse.json(
            { 
                error: "Internal Server Error", 
                message: (err as Error).message || "An unknown error occurred" 
            },
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    } finally {
        await client.end();
    }
}
