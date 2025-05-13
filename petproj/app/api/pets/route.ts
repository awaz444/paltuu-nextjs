import { createClient } from "../../../db/index";
import { NextRequest, NextResponse } from "next/server";

// Helper function for retrying database operations
async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delayMs = 1000
): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            
            // Only retry on connection-related errors
            const shouldRetry = [
                'ECONNRESET', 
                'ETIMEDOUT', 
                'ECONNREFUSED',
                'Connection terminated unexpectedly'
            ].some(code => (error as Error).message.includes(code));
            
            if (!shouldRetry || attempt === maxRetries) {
                throw error;
            }
            
            // Exponential backoff
            const waitTime = delayMs * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    
    throw lastError;
}

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
        months,
        foster_start_date,
        foster_end_date,
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
        // Connect with retry
        await withRetry(() => client.connect());

        // Insert new pet listing with retry
        const result = await withRetry(() => 
            client.query(
                `INSERT INTO pets (
                    owner_id, pet_name, pet_type, pet_breed, city_id, area, age, months, 
                    foster_start_date, foster_end_date, description, adoption_status, 
                    min_age_of_children, can_live_with_dogs, can_live_with_cats, 
                    must_have_someone_home, energy_level, cuddliness_level, health_issues, 
                    sex, listing_type, vaccinated, neutered, price, payment_frequency, created_at
                ) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, CURRENT_TIMESTAMP) 
                RETURNING *`,
                [
                    owner_id,
                    pet_name,
                    pet_type,
                    pet_breed,
                    city_id,
                    area,
                    age,
                    months,
                    foster_start_date,
                    foster_end_date,
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
                    payment_frequency
                ]
            )
        );

        const newPet = result.rows[0];

        // Fetch all admin user IDs with retry
        const adminResult = await withRetry(() => 
            client.query(`SELECT user_id FROM users WHERE role = 'admin'`)
        );

        const adminUserIds = adminResult.rows.map((row) => row.user_id);

        // Insert notifications for all admin users with retry
        if (adminUserIds.length > 0) {
            const notificationContent = `A new pet listing ${pet_name} has been added. Please approve or reject it.`;

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

            const notificationValues = adminUserIds.flatMap((user_id) => [
                user_id,
                notificationContent,
                "listing_type",
                false,
                new Date(),
            ]);

            await withRetry(() => 
                client.query(notificationQuery, notificationValues)
            );
        }

        // Notification for PET OWNER with retry
        const ownerNotificationContent = `Your pet listing "${pet_name}" has been submitted for approval. You'll be notified once it's approved.`;
        await withRetry(() =>
            client.query(
                `INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    owner_id,
                    ownerNotificationContent,
                    "listing_submission",
                    false,
                    new Date()
                ]
            )
        );

        return NextResponse.json(newPet, {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error('Final error after retries:', err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    } finally {
        try {
            await client.end();
        } catch (endError) {
            console.error('Error closing connection:', endError);
        }
    }
}

// GET method to fetch all pets
export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        await withRetry(() => client.connect());
        const result = await withRetry(() => client.query("SELECT * FROM pets"));
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
        try {
            await client.end();
        } catch (endError) {
            console.error('Error closing connection:', endError);
        }
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
        months, // Changed from 'month' to 'months' to match frontend
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
        await withRetry(() => client.connect());
        const result = await withRetry(() =>
            client.query(
                `UPDATE pets SET owner_id = $1, pet_name = $2, pet_type = $3, pet_breed = $4, city_id = $5, area = $6, 
                age = $7, months = $8, description = $9, adoption_status = $10, min_age_of_children = $11, can_live_with_dogs = $12, 
                can_live_with_cats = $13, must_have_someone_home = $14, energy_level = $15, cuddliness_level = $16, 
                health_issues = $17, sex = $18, listing_type = $19, vaccinated = $20, neutered = $21, price = $22, 
                payment_frequency = $23 WHERE pet_id = $24 RETURNING *`,
                [
                    owner_id,
                    pet_name,
                    pet_type,
                    pet_breed,
                    city_id,
                    area,
                    age,
                    months, // Added months parameter
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
                    pet_id, // Moved to $24
                ]
            )
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
        try {
            await client.end();
        } catch (endError) {
            console.error('Error closing connection:', endError);
        }
    }
}

// DELETE method to delete a pet by ID
export async function DELETE(req: NextRequest): Promise<NextResponse> {
    const { pet_id } = await req.json();
    const client = createClient();

    try {
        await withRetry(() => client.connect());
        const result = await withRetry(() =>
            client.query(
                "DELETE FROM pets WHERE pet_id = $1 RETURNING *",
                [pet_id]
            )
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
        try {
            await client.end();
        } catch (endError) {
            console.error('Error closing connection:', endError);
        }
    }
}