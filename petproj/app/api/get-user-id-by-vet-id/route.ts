import { createClient } from '../../../db/index';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        const { searchParams } = new URL(req.url);
        const vetId = searchParams.get('vet_id');

        if (!vetId) {
            return NextResponse.json(
                { error: 'vet_id is required' },
                { status: 400 }
            );
        }

        await client.connect();

        const query = 'SELECT user_id FROM vets WHERE vet_id = $1 LIMIT 1;';
        const values = [vetId];
        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Vet not found' },
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
