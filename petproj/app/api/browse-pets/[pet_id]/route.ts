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
            pets.months,
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
            pets.shop_id,
            users.user_id, 
            users.username, 
            users.name, 
            users.email, 
            users.phone_number, 
            users.profile_image_url, 
            cities.city_name AS city, 
            pet_images.image_id, 
            pet_images.image_url, 
            pet_images."order",
            rescue_shelters.shelter_id as rescue_shelter_id,
            rescue_shelters.shelter_name,
            rescue_shelters.logo_url as shelter_logo,
            shops.shop_id,
            shops.shop_name,
            shops.logo_url as shop_logo
        FROM pets
        JOIN users ON pets.owner_id = users.user_id
        JOIN cities ON pets.city_id = cities.city_id
        LEFT JOIN pet_images ON pets.pet_id = pet_images.pet_id
        LEFT JOIN rescue_shelters ON pets.shelter_id = rescue_shelters.shelter_id
        LEFT JOIN shops ON pets.shop_id = shops.shop_id
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

        const images = petData
            .filter((row: any) => row.image_id) // Only include rows with images
            .map((image: any) => ({
                image_id: image.image_id,
                image_url: image.image_url,
                order: image.order,
            }));

        // Base response object
        const response: any = {
            pet_id: pet.pet_id,
            pet_name: pet.pet_name,
            pet_type: pet.pet_type,
            pet_breed: pet.pet_breed,
            city: pet.city,
            area: pet.area,
            age: pet.age,
            months: pet.months,
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
            vaccinated: pet.vaccinated,
            neutered: pet.neutered,
            images: images,
        };

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
            case 'shop':
                if (pet.shop_id) {
                    response.shop = {
                        shop_id: pet.shop_id,
                        shop_name: pet.shop_name,
                        logo_url: pet.shop_logo
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
        await client.end(); // Close the database connection
    }
}