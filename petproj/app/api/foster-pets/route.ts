import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../db/index";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        await client.connect();

        const query = `
            SELECT 
                pets.*,                      
                cities.city_name AS city,     
                users.user_id,               
                users.profile_image_url,     
                pet_images.image_id,          
                pet_images.image_url        
            FROM pets
            JOIN users ON pets.owner_id = users.user_id
            JOIN cities ON pets.city_id = cities.city_id
            LEFT JOIN pet_images ON pets.pet_id = pet_images.pet_id AND pet_images."order" = 1
            WHERE pets.listing_type = 'foster'; 
        `;

        const result = await client.query(query);

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
        await client.end(); // Make sure to close the client connection
    }
}
