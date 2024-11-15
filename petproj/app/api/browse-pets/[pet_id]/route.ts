import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

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

        const query = `
        SELECT 
            pets.pet_id, 
            pets.owner_id, 
            pets.pet_name, 
            pets.pet_type, 
            pets.pet_breed, 
            pets.city_id, 
            pets.area, 
            pets.age, 
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
            pets.payment_frequency, 
            users.user_id, 
            users.username, 
            users.name, 
            users.email, 
            users.phone_number, 
            users.profile_image_url, 
            cities.city_name AS city, 
            pet_images.image_id, 
            pet_images.image_url, 
            pet_images."order" 
        FROM pets
        JOIN users ON pets.owner_id = users.user_id
        JOIN cities ON pets.city_id = cities.city_id
        LEFT JOIN pet_images ON pets.pet_id = pet_images.pet_id
        WHERE pets.pet_id = $1
        ORDER BY pet_images."order" ASC;
        `;

        const result = await client.query(query, [pet_id]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Pet not found" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const petData = result.rows;
        const pet = petData[0]; // Extract the pet data (first record)

        const images = petData.map((image: any) => ({
            image_id: image.image_id,
            image_url: image.image_url,
            order: image.order,
        }));

        // Return the structured response
        return NextResponse.json(
            {
                ...pet, // Pet details from the first row
                additional_images: images, // All images for this pet
            },
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
        await client.end(); // Close the database connection
    }
}

