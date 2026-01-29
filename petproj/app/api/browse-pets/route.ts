export const revalidate = 0; 

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../db/index";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        await client.connect();

        const { searchParams } = new URL(req.url);
        
        // Pagination params
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10); // Default to 10
        const offset = (page - 1) * limit;

        // Filter params
        const cityId = searchParams.get("city"); // "selectedCity" from frontend maps to this
        const speciesId = searchParams.get("species"); // "selectedSpecies"
        const breed = searchParams.get("breed");
        const sex = searchParams.get("sex");
        const minAge = searchParams.get("minAge");
        const maxAge = searchParams.get("maxAge");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const area = searchParams.get("area");
        const minChildAge = searchParams.get("minChildAge");
        const vaccinated = searchParams.get("vaccinated") === "true";
        const neutered = searchParams.get("neutered") === "true";
        const dogs = searchParams.get("dogs") === "true"; // canLiveWithDogs
        const cats = searchParams.get("cats") === "true"; // canLiveWithCats

        // Build WHERE clause
        const conditions: string[] = ["pets.adoption_status = 'available'", "pets.approved = true"];
        const values: any[] = [];
        let paramIndex = 1;

        if (cityId) {
            conditions.push(`pets.city_id = $${paramIndex++}`);
            values.push(parseInt(cityId));
        }
        if (speciesId) {
            conditions.push(`pets.pet_type = $${paramIndex++}`);
            values.push(parseInt(speciesId));
        }
        if (breed) {
            conditions.push(`LOWER(pets.pet_breed) LIKE $${paramIndex++}`);
            values.push(`%${breed.toLowerCase()}%`);
        }
        if (sex) {
            conditions.push(`pets.sex = $${paramIndex++}`);
            values.push(sex);
        }
        if (minAge) {
            conditions.push(`pets.age >= $${paramIndex++}`);
            values.push(parseFloat(minAge));
        }
        if (maxAge) {
            conditions.push(`pets.age <= $${paramIndex++}`);
            values.push(parseFloat(maxAge));
        }
        if (minPrice) {
            conditions.push(`pets.price >= $${paramIndex++}`);
            values.push(parseFloat(minPrice));
        }
        if (maxPrice) {
            conditions.push(`pets.price <= $${paramIndex++}`);
            values.push(parseFloat(maxPrice));
        }
        if (area) {
            conditions.push(`LOWER(pets.area) LIKE $${paramIndex++}`);
            values.push(`%${area.toLowerCase()}%`);
        }
        if (minChildAge) {
            conditions.push(`pets.min_age_of_children >= $${paramIndex++}`);
            values.push(parseInt(minChildAge));
        }
        if (vaccinated) {
            conditions.push(`pets.vaccinated = true`);
        }
        if (neutered) {
            conditions.push(`pets.neutered = true`);
        }
        if (dogs) {
            conditions.push(`pets.can_live_with_dogs = true`);
        }
        if (cats) {
            conditions.push(`pets.can_live_with_cats = true`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        // Get Total Count (for pagination)
        const countQuery = `
            SELECT COUNT(*) FROM pets
            JOIN cities ON pets.city_id = cities.city_id
            ${whereClause}
        `;
        const countResult = await client.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count, 10);

        // Get Data
        const dataQuery = `
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
        ${whereClause}
        ORDER BY pets.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        const dataValues = [...values, limit, offset];
        const result = await client.query(dataQuery, dataValues);

        return NextResponse.json({
            data: result.rows,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }, {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("Browse Pets API Error:", err);
        return NextResponse.json(
            { 
                error: "Internal Server Error", 
                message: (err as Error).message || "An unknown error occurred" 
            },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}
