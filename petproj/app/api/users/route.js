import { createClient } from '../../../db/index.js';

export async function POST(req) {
    const { username, name, DOB, city_id, email, password, phone_number, role } = await req.json();
    const client = createClient();

    try {
        await client.connect();
        const result = await client.query(
            'INSERT INTO users (username, name, DOB, city_id, email, password, phone_number, role, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP) RETURNING *',
            [username, name, DOB, city_id, email, password, phone_number, role]
        );
        return new Response(JSON.stringify(result.rows[0]), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Internal Server Error', message: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    } finally {
        await client.end();
    }
}

export async function GET(req) {
    const client = createClient();

    try {
        await client.connect(); 
        const result = await client.query('SELECT * FROM users');
        return new Response(JSON.stringify(result.rows), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Internal Server Error', message: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    } finally {
        await client.end(); 
    }
}

export async function PUT(req) {
    const { user_id, username, name, DOB, city_id, email, password, phone_number, role } = await req.json();
    const client = createClient();

    try {
        await client.connect(); 
        const result = await client.query(
            'UPDATE users SET username = $1, name = $2, DOB = $3, city_id = $4, email = $5, password = $6, phone_number = $7, role = $8 WHERE user_id = $9 RETURNING *',
            [username, name, DOB, city_id, email, password, phone_number, role, user_id]
        );
        
        if (result.rows.length === 0) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify(result.rows[0]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Internal Server Error', message: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    } finally {
        await client.end();
    }
}


export async function DELETE(req) {
    const { user_id } = await req.json(); // Assuming you're sending the user_id in the body of the DELETE request
    const client = createClient();

    try {
        await client.connect(); // Connect to the database
        const result = await client.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [user_id]);

        if (result.rows.length === 0) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Internal Server Error', message: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    } finally {
        await client.end(); // Always close the connection
    }
}
