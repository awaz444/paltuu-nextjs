// pages/api/users/route.ts
import { createClient } from '../../../db/index'; 
import { NextRequest, NextResponse } from 'next/server';

// POST method to create a new user
export async function POST(req: NextRequest): Promise<NextResponse> {
    const { username, name, DOB, city_id, email, password, phone_number, role } = await req.json();
    const client = createClient();

    try {
        await client.connect();
        const result = await client.query(
            'INSERT INTO users (username, name, DOB, city_id, email, password, phone_number, role, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP) RETURNING *',
            [username, name, DOB, city_id, email, password, phone_number, role]
        );
        return NextResponse.json(result.rows[0], {
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
        await client.end();
    }
}

// GET method to fetch all users
export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        await client.connect(); 
        const result = await client.query('SELECT * FROM users');
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

// PUT method to update a user by ID
export async function PUT(req: NextRequest): Promise<NextResponse> {
    const { user_id, username, name, DOB, city_id, email, password, phone_number, role } = await req.json();
    const client = createClient();

    try {
        await client.connect(); 
        const result = await client.query(
            'UPDATE users SET username = $1, name = $2, DOB = $3, city_id = $4, email = $5, password = $6, phone_number = $7, role = $8 WHERE user_id = $9 RETURNING *',
            [username, name, DOB, city_id, email, password, phone_number, role, user_id]
        );
        
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, {
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
        await client.end();
    }
}

// DELETE method to delete a user by ID
export async function DELETE(req: NextRequest): Promise<NextResponse> {
    const { user_id } = await req.json(); // Assuming you're sending the user_id in the body of the DELETE request
    const client = createClient();

    try {
        await client.connect(); // Connect to the database
        const result = await client.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [user_id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return NextResponse.json({ message: 'User deleted successfully' }, {
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
