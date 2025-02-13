import { createClient } from '../../../../db/index';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { user_id: string } }): Promise<NextResponse> {
    const client = createClient();

    try {
        const { user_id } = params;

        if (!user_id) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        await client.connect();

        // Query to get the applied status for the vet with the given user_id
        const query = 'SELECT applied FROM vets WHERE user_id = $1 LIMIT 1;';
        const values = [user_id];
        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Vet not found for the user_id' },
                { status: 404 }
            );
        }

        const applied = result.rows[0].applied;

        // Return the applied status
        return NextResponse.json(
            { applied },
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
