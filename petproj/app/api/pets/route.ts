import { createClient } from "../../../db/index";
import { NextRequest, NextResponse } from "next/server";

// POST method to create a new pet
export async function POST(req: NextRequest): Promise<NextResponse> {
    const {
        owner_id,
        pet_name,
        pet_type,
        pet_breed,
        city_id,
        area,
        age,
        description,
        adoption_status,
        min_age_of_children,
        can_live_with_dogs,
        can_live_with_cats,
        must_have_someone_home,
        energy_level,
        cuddliness_level,
        health_issues,
        sex,
        listing_type,
        vaccinated,
        neutered,
        price,
        payment_frequency,
    } = await req.json();

    const client = createClient();

    try {
        await client.connect();

        // Insert new pet listing
        const result = await client.query(
            `INSERT INTO pets (owner_id, pet_name, pet_type, pet_breed, city_id, area, age, description, adoption_status, 
            min_age_of_children, can_live_with_dogs, can_live_with_cats, must_have_someone_home, energy_level, 
            cuddliness_level, health_issues, sex, listing_type, vaccinated, neutered, price, payment_frequency, created_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, CURRENT_TIMESTAMP) 
            RETURNING *`,
            [
                owner_id,
                pet_name,
                pet_type,
                pet_breed,
                city_id,
                area,
                age,
                description,
                adoption_status,
                min_age_of_children,
                can_live_with_dogs,
                can_live_with_cats,
                must_have_someone_home,
                energy_level,
                cuddliness_level,
                health_issues,
                sex,
                listing_type,
                vaccinated,
                neutered,
                price,
                payment_frequency,
            ]
        );

        const newPet = result.rows[0];

        // **Fetch all admin user IDs**
        const adminResult = await client.query(
            `SELECT user_id FROM users WHERE role = 'admin'`
        );

        const adminUserIds = adminResult.rows.map((row) => row.user_id);

        // **Insert notifications for all admin users**
        // **Insert notifications for all admin users**
        if (adminUserIds.length > 0) {
            const notificationContent = `A new pet listing ${pet_name} has been added. Please approve or reject it.`;

            // Dynamically generate the placeholders for each row
            const notificationQuery = `
        INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent)
        VALUES ${adminUserIds
            .map(
                (_, i) =>
                    `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${
                        i * 5 + 4
                    }, $${i * 5 + 5})`
            )
            .join(", ")}
    `;

            // Create the array of parameter values for each admin
            const notificationValues = adminUserIds.flatMap((user_id) => [
                user_id,
                notificationContent,
                "listing_type",
                false,
                new Date(), // Use JS Date object to ensure type consistency
            ]);

            await client.query(notificationQuery, notificationValues);
        }

        return NextResponse.json(newPet, {
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
        await client.end();
    }
}

// GET method to fetch all pets
export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        await client.connect();
        const result = await client.query("SELECT * FROM pets");
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
        await client.end();
    }
}

// PUT method to update a pet by ID
export async function PUT(req: NextRequest): Promise<NextResponse> {
    const {
        pet_id,
        owner_id,
        pet_name,
        pet_type,
        pet_breed,
        city_id,
        area,
        age,
        description,
        adoption_status,
        min_age_of_children,
        can_live_with_dogs,
        can_live_with_cats,
        must_have_someone_home,
        energy_level,
        cuddliness_level,
        health_issues,
        sex,
        listing_type,
        vaccinated,
        neutered,
        price,
        payment_frequency,
    } = await req.json();

    const client = createClient();

    try {
        await client.connect();
        const result = await client.query(
            `UPDATE pets SET owner_id = $1, pet_name = $2, pet_type = $3, pet_breed = $4, city_id = $5, area = $6, 
            age = $7, description = $8, adoption_status = $9, min_age_of_children = $10, can_live_with_dogs = $11, 
            can_live_with_cats = $12, must_have_someone_home = $13, energy_level = $14, cuddliness_level = $15, 
            health_issues = $16, sex = $17, listing_type = $18, vaccinated = $19, neutered = $20, price = $21, 
            payment_frequency = $22 WHERE pet_id = $23 RETURNING *`,
            [
                owner_id,
                pet_name,
                pet_type,
                pet_breed,
                city_id,
                area,
                age,
                description,
                adoption_status,
                min_age_of_children,
                can_live_with_dogs,
                can_live_with_cats,
                must_have_someone_home,
                energy_level,
                cuddliness_level,
                health_issues,
                sex,
                listing_type,
                vaccinated,
                neutered,
                price,
                payment_frequency,
                pet_id,
            ]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Pet not found" },
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
        await client.end();
    }
}

// DELETE method to delete a pet by ID
export async function DELETE(req: NextRequest): Promise<NextResponse> {
    const { pet_id } = await req.json();
    const client = createClient();

    try {
        await client.connect();
        const result = await client.query(
            "DELETE FROM pets WHERE pet_id = $1 RETURNING *",
            [pet_id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Pet not found" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        return NextResponse.json(
            { message: "Pet deleted successfully" },
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
