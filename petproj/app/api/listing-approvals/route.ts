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
                { error: 'Invalid request body', message: 'pet_id and approved are required.' },
                { status: 400 }
            );
        }

        await client.connect();
        console.log("Database connected for PUT request");

        // Begin transaction
        await client.query('BEGIN');

        // Update the pet's approval status
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
                approved,
                created_at;
            `,
            [approved, pet_id]
        );

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json(
                { error: 'Not Found', message: 'Pet not found.' },
                { status: 404 }
            );
        }

        // Commit the transaction
        await client.query('COMMIT');
        console.log("Pet approval updated successfully:", result.rows[0]);

        return NextResponse.json(
            {
                message: 'Pet approved successfully.',
                pet: result.rows[0]
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("PUT Error:", err);
        // Rollback transaction if there's an error
        try {
            await client.query('ROLLBACK');
        } catch (rollbackErr) {
            console.error("Rollback error:", rollbackErr);
        }

        return NextResponse.json(
            { error: 'Internal Server Error', message: (err as Error).message },
            { status: 500 }
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
