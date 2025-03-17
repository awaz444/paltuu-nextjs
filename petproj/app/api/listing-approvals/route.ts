import { createClient } from '../../../db/index';
import { NextRequest, NextResponse } from 'next/server';

// GET method to fetch all unapproved pets
export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        await client.connect();
        console.log("Database connected for GET request");

        const result = await client.query(`
            SELECT
                p.*,
                c.city_name as city
            FROM pets p
            LEFT JOIN cities c ON p.city_id = c.city_id
            WHERE p.approved = false
            ORDER BY p.created_at DESC
        `);

        return NextResponse.json(result.rows, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error("GET Error:", err);
        return NextResponse.json(
            { error: 'Internal Server Error', message: (err as Error).message },
            { status: 500 }
        );
    } finally {
        try {
            await client.end();
            console.log("Database connection closed for GET request");
        } catch (err) {
            console.error("Error closing connection:", err);
        }
    }
}

// PUT method to approve a pet
export async function PUT(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        const body = await req.json();
        const { pet_id, approved } = body;

        console.log("Received approval request for pet_id:", pet_id);

        // Validate input
        if (!pet_id || typeof approved !== 'boolean') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request body',
                    message: 'pet_id and approved are required.'
                },
                { status: 400 }
            );
        }

        await client.connect();
        await client.query('BEGIN');

        // Update the pet's approval status and get owner info
        const result = await client.query(
            `
            UPDATE pets
            SET
                approved = $1,
                created_at = CURRENT_TIMESTAMP
            WHERE pet_id = $2
            RETURNING
                pet_id,
                pet_name,
                owner_id,
                approved,
                created_at;
            `,
            [approved, pet_id]
        );

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json(
                {
                    success: false,
                    error: 'Not Found',
                    message: 'Pet not found.'
                },
                { status: 404 }
            );
        }

        const updatedPet = result.rows[0];

        // Add notification to pet owner if approved
        if (approved) {
            await client.query(
                `INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    updatedPet.owner_id,
                    `Your pet listing "${updatedPet.pet_name}" has been approved and is now visible to everyone!`,
                    "listing_approval",
                    false,
                    new Date()
                ]
            );
        }

        await client.query('COMMIT');

        return NextResponse.json(
            {
                success: true,
                message: `Pet ${approved ? 'approved' : 'rejected'} successfully.`,
                pet: updatedPet
            },
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } finally {
        try {
            await client.end();
            console.log("Database connection closed for PUT request");
        } catch (err) {
            console.error("Error closing connection:", err);
        }
    }
}
