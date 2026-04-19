/**
 * @swagger
 * /api/browse-pets/[pet_id]:
 *   get:
 *     summary: Auto-generated summary for /api/browse-pets/[pet_id]
 *     tags: [Auto-Generated]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

// ... existing imports ...

const petTypeMap: Record<number, string> = {
    1: "Dog",
    2: "Cat",
    3: "Bird",
    4: "Fish",
    5: "Rabbit",
    6: "Hamster",
    7: "Guinea Pig",
    8: "Turtle",
    11: "Horse",
    15: "Mouse",
    49: "Other"
};

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const pet_id = req.nextUrl.pathname.split('/').pop(); 

    if (!pet_id) {
        return NextResponse.json(
            { error: "Pet ID is required" },
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    try {
        await client.connect();

        // Main pet query
        const petQuery = `
        SELECT 
            pets.pet_id, 
            pets.owner_id, 
            pets.pet_name, 
            pets.pet_type, 
            pets.pet_breed, 
            pets.city_id, 
            pets.area, 
            pets.age_months,
            pets.contact_number,
            pets.description, 
            pets.adoption_status, 
            pets.price, 
            pets.min_age_of_children, 
            pets.can_live_with_dogs, 
            pets.can_live_with_cats, 
            pets.must_have_someone_home, 
            pets.energy_level, 
            pets.cuddliness_level, 
            pets.health_issues, 
            pets.created_at, 
            pets.sex, 
            pets.listing_type, 
            pets.vaccinated, 
            pets.neutered, 
            pets.shelter_id,
            pets.rescue_story,
            users.user_id, 
            users.username, 
            users.name, 
            users.email, 
            users.phone_number, 
            users.profile_image_url, 
            cities.city_name AS city,
            rescue_shelters.shelter_id as rescue_shelter_id,
            rescue_shelters.shelter_name,
            rescue_shelters.logo_url as shelter_logo
        FROM pets
        JOIN users ON pets.owner_id = users.user_id
        JOIN cities ON pets.city_id = cities.city_id
        LEFT JOIN rescue_shelters ON pets.shelter_id = rescue_shelters.shelter_id
        WHERE pets.pet_id = $1
        `;

        const petResult = await client.query(petQuery, [pet_id]);

        if (petResult.rows.length === 0) {
            return NextResponse.json(
                { error: "Pet not found" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const pet = petResult.rows[0];

        // Images query
        const imagesQuery = `
            SELECT image_id, image_url, "order"
            FROM pet_images
            WHERE pet_id = $1
            ORDER BY "order" ASC
        `;
        const imagesResult = await client.query(imagesQuery, [pet_id]);
        const images = imagesResult.rows;

        // Special needs query (only for rescue pets)
        let specialNeeds = [];
        if (pet.listing_type === 'rescue') {
            const specialNeedsQuery = `
                SELECT special_need
                FROM rescue_special_needs
                WHERE pet_id = $1
            `;
            const specialNeedsResult = await client.query(specialNeedsQuery, [pet_id]);
            specialNeeds = specialNeedsResult.rows.map((row: any) => row.special_need);
        }

        // Medical conditions query (only for rescue pets)
        let medicalConditions = [];
        if (pet.listing_type === 'rescue') {
            const medicalConditionsQuery = `
                SELECT condition, treatment_cost, treated
                FROM rescue_medical_conditions
                WHERE pet_id = $1
            `;
            const medicalConditionsResult = await client.query(medicalConditionsQuery, [pet_id]);
            medicalConditions = medicalConditionsResult.rows;
        }
        
        // Tags query
        const tagsQuery = `
            SELECT t.tag_id, t.tag_name, t.tag_category
            FROM pet_tags t
            JOIN pet_tag_assignments pta ON t.tag_id = pta.tag_id
            WHERE pta.pet_id = $1
        `;
        const tagsResult = await client.query(tagsQuery, [pet_id]);
        const tags = tagsResult.rows;

        // Base response object
        const response: any = {
            pet_id: pet.pet_id,
            pet_name: pet.pet_name,
            pet_type: petTypeMap[pet.pet_type] || "Unknown", 
            pet_breed: pet.pet_breed,
            city: pet.city,
            area: pet.area,
            age_months: pet.age_months,
            description: pet.description,
            adoption_status: pet.adoption_status,
            price: pet.price,
            min_age_of_children: pet.min_age_of_children,
            can_live_with_dogs: pet.can_live_with_dogs,
            can_live_with_cats: pet.can_live_with_cats,
            must_have_someone_home: pet.must_have_someone_home,
            energy_level: pet.energy_level,
            cuddliness_level: pet.cuddliness_level,
            health_issues: pet.health_issues,
            created_at: pet.created_at,
            sex: pet.sex,
            listing_type: pet.listing_type,
            phone_number: pet.contact_number, // Strictly use the listing-specific phone number
            images: images,
            tags: tags,
        };

        // Add rescue-specific data for rescue pets
        if (pet.listing_type === 'rescue') {
            response.rescue_story = pet.rescue_story;
            response.special_needs = specialNeeds;
            response.medical_conditions = medicalConditions;
        }

        // Add appropriate owner/shop/shelter details based on listing type
        switch (pet.listing_type) {
            case 'adoption':
            case 'sell':
                response.owner = {
                    user_id: pet.user_id,
                    username: pet.username,
                    name: pet.name,
                    profile_image_url: pet.profile_image_url
                };
                break;
            case 'rescue':
                if (pet.rescue_shelter_id) {
                    response.shelter = {
                        shelter_id: pet.rescue_shelter_id,
                        shelter_name: pet.shelter_name,
                        logo_url: pet.shelter_logo
                    };
                }
                break;
        }

        // Return the structured response
        return NextResponse.json(
            response,
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
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