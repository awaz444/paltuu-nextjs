import { createClient } from '../../../../db/index'; 
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    const petId = params.id;
    const client = createClient();

    try {
        await client.connect();
        
        const result = await client.query('SELECT * FROM pets WHERE pet_id = $1', [petId]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Pet not found' }, {
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