import { createClient } from "../../../db/index";
import { NextRequest, NextResponse } from "next/server";
import { sendNewListingNotification } from "../../../utils/mailjet";

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
        age_months,
        contact_number,
        tags,
        description,
        adoption_status,
        min_age_of_children,
        can_live_with_dogs,
        can_live_with_cats,
        must_have_someone_home,
        health_issues,
        sex,
        listing_type,
        vaccinated,
        neutered,
        price,
        rescue_story,
        shelter_id,
        shop_id,
        energy_level,
        cuddliness_level,
    } = await req.json();

    const client = createClient();

    try {
        // Connect with retry
        await withRetry(() => client.connect());

        // Insert new pet listing with retry
                // Set price to null for rescue listings
                const finalPrice = listing_type === 'rescue' ? null : price;

                const result = await withRetry<any>(() =>
                    client.query(
                        `INSERT INTO pets (
                            owner_id, pet_name, pet_type, pet_breed, city_id, area, age_months, contact_number,
                            description, adoption_status,
                            min_age_of_children, can_live_with_dogs, can_live_with_cats,
                            must_have_someone_home, health_issues,
                            sex, listing_type, vaccinated, neutered, price, rescue_story, shelter_id, shop_id, created_at,
                            energy_level, cuddliness_level
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, CURRENT_TIMESTAMP, $24, $25)
                        RETURNING *`,
                        [
                            owner_id,
                            pet_name,
                            pet_type,
                            pet_breed,
                            city_id,
                            area,
                            age_months,
                            contact_number,
                            description,
                            adoption_status,
                            min_age_of_children,
                            can_live_with_dogs,
                            can_live_with_cats,
                            must_have_someone_home,
                            health_issues,
                            sex,
                            listing_type,
                            vaccinated,
                            neutered,
                            finalPrice,
                            rescue_story,
                            shelter_id,
                            shop_id,
                            energy_level,
                            cuddliness_level,
                        ]
                    )
                );

        const newPet = result.rows[0];

        // Insert tags if any exist
        if (tags && Array.isArray(tags) && tags.length > 0) {
            const tagValues = tags.map((tagId: number) => `(${newPet.pet_id}, ${tagId})`).join(", ");
            await withRetry(() => 
                client.query(`INSERT INTO pet_tag_assignments (pet_id, tag_id) VALUES ${tagValues}`)
            );
        }

        // Send email notification to admin (non-blocking)
        sendNewListingNotification({
            pet_id: newPet.pet_id,
            pet_name: pet_name,
            pet_type: pet_type,
            listing_type: listing_type,
        }).catch((err) => console.warn('Failed to send new listing email notification', err));

        const adminResult = await withRetry<any>(() =>
            client.query(`SELECT user_id FROM users WHERE role = 'admin'`)
        );

        const adminUserIds = adminResult.rows.map((row: any) => row.user_id);

        // Insert notifications for all admin users with retry
        if (adminUserIds.length > 0) {
            const notificationContent = `A new pet listing ${pet_name} has been added. Please approve or reject it.`;

            const notificationQuery = `
                INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent, entity_type, entity_id)
                VALUES ${adminUserIds
                    .map(
                        (_: any, i: number) =>
                            `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${
                                i * 7 + 4
                            }, $${i * 7 + 5}, $${i * 7 + 6}, $${i * 7 + 7})`
                    )
                    .join(", ")}
            `;

            const notificationValues = adminUserIds.flatMap((user_id: any) => [
                user_id,
                notificationContent,
                "listing_type",
                false,
                new Date(),
                "pet",
                newPet.pet_id
            ]);

            await withRetry(() =>
                client.query(notificationQuery, notificationValues)
            );
        }

        // Notification for PET OWNER with retry
        const ownerNotificationContent = `Your pet listing "${pet_name}" has been submitted for approval. You'll be notified once it's approved.`;
        await withRetry(() =>
            client.query(
                `INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent, entity_type, entity_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    owner_id,
                    ownerNotificationContent,
                    "listing_submission",
                    false,
                    new Date(),
                    "pet",
                    newPet.pet_id
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
        const result = await withRetry<any>(() => 
            client.query(`
                SELECT pets.*, cities.city_name AS city 
                FROM pets 
                LEFT JOIN cities ON pets.city_id = cities.city_id
            `)
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
        age_months,
        contact_number,
        tags,
        description,
        adoption_status,
        min_age_of_children,
        can_live_with_dogs,
        can_live_with_cats,
        must_have_someone_home,
        health_issues,
        sex,
        listing_type,
        vaccinated,
        neutered,
        price,
        energy_level,
        cuddliness_level,
    } = await req.json();

    const client = createClient();

    try {
        await withRetry(() => client.connect());
        const result = await withRetry<any>(() =>
            client.query(
                `UPDATE pets SET owner_id = $1, pet_name = $2, pet_type = $3, pet_breed = $4, city_id = $5, area = $6,
                age_months = $7, contact_number = $8, description = $9, adoption_status = $10, min_age_of_children = $11, can_live_with_dogs = $12,
                can_live_with_cats = $13, must_have_someone_home = $14, health_issues = $15, sex = $16, listing_type = $17, vaccinated = $18,
                neutered = $19, price = $20, energy_level = $22, cuddliness_level = $23 WHERE pet_id = $21 RETURNING *`,
                [
                    owner_id,
                    pet_name,
                    pet_type,
                    pet_breed,
                    city_id,
                    area,
                    age_months,
                    contact_number,
                    description,
                    adoption_status,
                    min_age_of_children,
                    can_live_with_dogs,
                    can_live_with_cats,
                    must_have_someone_home,
                    health_issues,
                    sex,
                    listing_type,
                    vaccinated,
                    neutered,
                    price,
                    pet_id,
                    energy_level,
                    cuddliness_level,
                ]
            )
        );

        // Update tags if provided
        if (tags && Array.isArray(tags)) {
            await withRetry(() => client.query("DELETE FROM pet_tag_assignments WHERE pet_id = $1", [pet_id]));
            if (tags.length > 0) {
                const tagValues = tags.map((tagId: number) => `(${pet_id}, ${tagId})`).join(", ");
                await withRetry(() => 
                    client.query(`INSERT INTO pet_tag_assignments (pet_id, tag_id) VALUES ${tagValues}`)
                );
            }
        }

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

        // Start a transaction to ensure all related data is deleted
        await withRetry(() => client.query('BEGIN'));

        try {
            // First, delete related records in the correct order
            // Delete from rescue_medical_conditions
            await withRetry(() =>
                client.query(
                    "DELETE FROM rescue_medical_conditions WHERE pet_id = $1",
                    [pet_id]
                )
            );

            // Delete from rescue_special_needs
            await withRetry(() =>
                client.query(
                    "DELETE FROM rescue_special_needs WHERE pet_id = $1",
                    [pet_id]
                )
            );

            // Delete from pet_images
            await withRetry(() =>
                client.query(
                    "DELETE FROM pet_images WHERE pet_id = $1",
                    [pet_id]
                )
            );

            // Delete from adoption_applications
            await withRetry(() =>
                client.query(
                    "DELETE FROM adoption_applications WHERE pet_id = $1",
                    [pet_id]
                )
            );

            // Finally, delete the pet itself
            const result = await withRetry<any>(() =>
                client.query(
                    "DELETE FROM pets WHERE pet_id = $1 RETURNING *",
                    [pet_id]
                )
            );

            if (result.rows.length === 0) {
                await withRetry(() => client.query('ROLLBACK'));
                return NextResponse.json(
                    { error: "Pet not found" },
                    {
                        status: 404,
                        headers: { "Content-Type": "application/json" },
                    }
                );
            }

            // Commit the transaction
            await withRetry(() => client.query('COMMIT'));

            return NextResponse.json(
                { message: "Pet deleted successfully" },
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                }
            );
        } catch (deleteError) {
            // Rollback the transaction if any deletion fails
            await withRetry(() => client.query('ROLLBACK'));
            throw deleteError;
        }
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