import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const user_id = req.nextUrl.pathname.split("/").pop();

    if (!user_id) {
        return NextResponse.json(
            { error: "User ID is required" },
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
                p.pet_id,
                p.owner_id,
                p.pet_name,
                p.pet_type,
                p.pet_breed,
                c.city_name AS city,
                p.area,
                p.age,
                p.description,
                p.adoption_status,
                p.price,
                p.min_age_of_children,
                p.can_live_with_dogs,
                p.can_live_with_cats,
                p.must_have_someone_home,
                p.energy_level,
                p.cuddliness_level,
                p.health_issues,
                p.created_at,
                p.sex,
                p.listing_type,
                p.vaccinated,
                p.neutered,
                p.payment_frequency
            FROM pets p
            LEFT JOIN cities c ON p.city_id = c.city_id
            WHERE p.owner_id = $1;
        `;

        const result = await client.query(query, [user_id]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "No listings found for this user" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const listings = result.rows.map((row) => ({
            pet_id: row.pet_id,
            owner_id: row.owner_id,
            pet_name: row.pet_name,
            pet_type: row.pet_type,
            pet_breed: row.pet_breed,
            city: row.city,
            area: row.area,
            age: row.age,
            description: row.description,
            adoption_status: row.adoption_status,
            price: row.price,
            min_age_of_children: row.min_age_of_children,
            can_live_with_dogs: row.can_live_with_dogs,
            can_live_with_cats: row.can_live_with_cats,
            must_have_someone_home: row.must_have_someone_home,
            energy_level: row.energy_level,
            cuddliness_level: row.cuddliness_level,
            health_issues: row.health_issues,
            created_at: row.created_at,
            sex: row.sex,
            listing_type: row.listing_type,
            vaccinated: row.vaccinated,
            neutered: row.neutered,
            payment_frequency: row.payment_frequency,
        }));

        return NextResponse.json(
            { user_id, listings },
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
