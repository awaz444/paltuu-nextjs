import { createClient } from '../../../db/index';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        await client.connect();

        // Query to get vet_id from vets table based on user_id
        const query = 'SELECT vet_id FROM vets WHERE user_id = $1 LIMIT 1;';
        const values = [userId];
        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Vet not found for the given user ID' },
                { status: 404 }
            );
        }

        const vet_id = result.rows[0].vet_id;

        return NextResponse.json(
            { vet_id },
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
