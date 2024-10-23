// pages/api/vets/route.ts
import { createClient } from "../../../db/index";
import { NextRequest, NextResponse } from "next/server";

// POST method to make an existing user a vet
// POST method to make an existing user a vet
export async function POST(req: NextRequest): Promise<NextResponse> {
    const { user_id, clinic_name, location, minimum_fee, contact_details, bio } = await req.json(); // Updated with 'bio'
    const client = createClient();

    try {
        await client.connect(); // Connect to the database

        // Ensure that the user exists
        const userCheck = await client.query(
            "SELECT * FROM users WHERE user_id = $1",
            [user_id]
        );

        if (userCheck.rows.length === 0) {
            return NextResponse.json(
                { error: "User not found" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Insert into the vets table with the new fields
        const vetResult = await client.query(
            `INSERT INTO vets 
                (user_id, clinic_name, location, minimum_fee, contact_details, bio, profile_verified, created_at) 
            VALUES 
                ($1, $2, $3, $4, $5, $6, false, CURRENT_TIMESTAMP) 
            RETURNING *`,
            [user_id, clinic_name, location, minimum_fee, contact_details, bio]
        );

        // Optionally, update the user’s role to 'vet' in the users table if needed
        await client.query("UPDATE users SET role = $1 WHERE user_id = $2", [
            "vet",
            user_id,
        ]);

        return NextResponse.json(vetResult.rows[0], {
            status: 201,
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
        await client.end(); // Always close the connection
    }
}


// GET method to fetch all vets
export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        await client.connect(); // Connect to the database

        const result = await client.query(
            `SELECT 
                vets.*,                        
                users.name,                             -- Vet's name
                users.profile_image_url,                -- Vet's profile picture
                cities.city_id,
                cities.city_name,                       -- Vet's city
                COALESCE(
                    json_agg(DISTINCT jsonb_build_object(
                        'qualification_id', qualifications.qualification_id,
                        'qualification_name', qualifications.qualification_name,
                        'year_acquired', vet_qualifications.year_acquired,
                        'note', vet_qualifications.note
                    )) FILTER (WHERE qualifications.qualification_name IS NOT NULL), '[]'
                ) AS qualifications,                   -- Array of qualifications
            
                COALESCE(
                    json_agg(DISTINCT jsonb_build_object(
                        'category_id', pet_category.category_id,
                        'category_name', pet_category.category_name
                    )) FILTER (WHERE pet_category.category_name IS NOT NULL), '[]'
                ) AS specializations                   -- Array of pet specializations
            FROM vets
            JOIN users ON vets.user_id = users.user_id                -- Join to get user's info
            JOIN cities ON users.city_id = cities.city_id             -- Join to get city info
            LEFT JOIN vet_qualifications ON vets.vet_id = vet_qualifications.vet_id  -- Join to get vet's qualifications
            LEFT JOIN qualifications ON vet_qualifications.qualification_id = qualifications.qualification_id  -- Get qualification details
            LEFT JOIN vet_specializations ON vets.vet_id = vet_specializations.vet_id  -- Join to get vet's specializations
            LEFT JOIN pet_category ON vet_specializations.category_id = pet_category.category_id  -- Get specialization category details
            GROUP BY vets.vet_id, users.name, users.profile_image_url, cities.city_id, cities.city_name;
        `
        );

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
        await client.end(); // Always close the connection
    }
}

// PUT method to update a vet by ID
// PUT method to update a vet by ID
export async function PUT(req: NextRequest): Promise<NextResponse> {
    const { vet_id, clinic_name, location, minimum_fee, contact_details, bio, profile_verified } = await req.json(); // Updated with 'bio' and 'profile_verified'
    const client = createClient();

    try {
        await client.connect(); // Connect to the database

        const result = await client.query(
            `UPDATE vets 
             SET clinic_name = $1, location = $2, minimum_fee = $3, contact_details = $4, bio = $5, profile_verified = $6 
             WHERE vet_id = $7 RETURNING *`,
            [clinic_name, location, minimum_fee, contact_details, bio, profile_verified, vet_id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Vet not found" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        return NextResponse.json(result.rows[0], {
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
        await client.end(); // Always close the connection
    }
}

// DELETE method to delete a vet by ID
export async function DELETE(req: NextRequest): Promise<NextResponse> {
    const { vet_id } = await req.json(); // Assuming vet_id is passed in the body
    const client = createClient();

    try {
        await client.connect(); // Connect to the database

        // First, delete the vet from the vets table
        const vetResult = await client.query(
            "DELETE FROM vets WHERE vet_id = $1 RETURNING *",
            [vet_id]
        );

        if (vetResult.rows.length === 0) {
            return NextResponse.json(
                { error: "Vet not found" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Optionally, delete the vet from the users table as well
        const user_id = vetResult.rows[0].user_id;
        await client.query("DELETE FROM users WHERE user_id = $1", [user_id]);

        return NextResponse.json(
            { message: "Vet deleted successfully" },
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
        await client.end(); // Always close the connection
    }
}
