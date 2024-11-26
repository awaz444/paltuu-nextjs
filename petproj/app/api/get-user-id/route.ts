import { createClient } from '../../../db/index';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        await client.connect();

        const query = 'SELECT user_id FROM users WHERE email = $1 LIMIT 1;';
        const values = [email];
        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const user_id = result.rows[0].user_id;

        return NextResponse.json(
            { user_id },
            { status: 200 }
        );
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: (error as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}
