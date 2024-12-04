import { createClient } from '../../../db/index'; 
import { NextRequest, NextResponse } from 'next/server';

// GET method to fetch all unapproved pets
export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        await client.connect(); 
        const result = await client.query(`SELECT * FROM pets WHERE approved = 'false'`);
        return NextResponse.json(result.rows, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: 'Internal Server Error', message: (err as Error).message },
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } finally {
        await client.end(); 
    }
}

// PUT method to approve a pet
export async function PUT(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        const body = await req.json();
        const { pet_id, approved } = body;

        // Validate input
        if (!pet_id || typeof approved !== 'boolean') {
            return NextResponse.json(
                { error: 'Invalid request body', message: 'pet_id and approved are required.' },
                { status: 400 }
            );
        }

        await client.connect();
        const result = await client.query(
            `
            UPDATE pets
            SET approved = $1
            WHERE pet_id = $2
            RETURNING pet_id, approved;
            `,
            [approved, pet_id]
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: 'Not Found', message: 'Pet not found.' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: 'Pet approved successfully.', pet: result.rows[0] },
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: 'Internal Server Error', message: (err as Error).message },
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } finally {
        await client.end();
    }
}
