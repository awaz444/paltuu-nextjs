// pages/api/vets/route.ts
import { createClient } from '../../../db/index';
import { NextRequest, NextResponse } from 'next/server';

// POST method to make an existing user a vet
export async function POST(req: NextRequest): Promise<NextResponse> {
    const { user_id, clinic_name, location, minimum_fee, contact_details } = await req.json(); // Take in vet-specific data
    const client = createClient();

    try {
        await client.connect(); // Connect to the database

        // Ensure that the user exists
        const userCheck = await client.query(
            'SELECT * FROM users WHERE user_id = $1',
            [user_id]
        );

        if (userCheck.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Insert into the vets table
        const vetResult = await client.query(
            'INSERT INTO vets (user_id, clinic_name, location, minimum_fee, contact_details, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *',
            [user_id, clinic_name, location, minimum_fee, contact_details]
        );

        // Optionally, update the user’s role to 'vet' in the users table if needed
        await client.query('UPDATE users SET role = $1 WHERE user_id = $2', ['vet', user_id]);

        return NextResponse.json(vetResult.rows[0], {
            status: 201,
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
        await client.end(); // Always close the connection
    }
}

// GET method to fetch all vets
export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        await client.connect(); // Connect to the database

        const result = await client.query(
            'SELECT vets.*, users.username, users.name, users.email, users.phone_number FROM vets JOIN users ON vets.user_id = users.user_id'
        );

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
        await client.end(); // Always close the connection
    }
}

// PUT method to update a vet by ID
export async function PUT(req: NextRequest): Promise<NextResponse> {
    const { vet_id, clinic_name, location, minimum_fee, contact_details } = await req.json();
    const client = createClient();

    try {
        await client.connect(); // Connect to the database

        const result = await client.query(
            'UPDATE vets SET clinic_name = $1, location = $2, minimum_fee = $3, contact_details = $4 WHERE vet_id = $5 RETURNING *',
            [clinic_name, location, minimum_fee, contact_details, vet_id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Vet not found' }, {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return NextResponse.json(result.rows[0], {
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
        const vetResult = await client.query('DELETE FROM vets WHERE vet_id = $1 RETURNING *', [vet_id]);

        if (vetResult.rows.length === 0) {
            return NextResponse.json({ error: 'Vet not found' }, {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Optionally, delete the vet from the users table as well
        const user_id = vetResult.rows[0].user_id;
        await client.query('DELETE FROM users WHERE user_id = $1', [user_id]);

        return NextResponse.json({ message: 'Vet deleted successfully' }, {
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
        await client.end(); // Always close the connection
    }
}
