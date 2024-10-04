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