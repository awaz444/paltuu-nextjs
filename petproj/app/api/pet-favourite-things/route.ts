import { createClient } from '../../../db/index'; 
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    
    try {
        await client.connect();
        const result = await client.query('SELECT * FROM favorite_things');
        return NextResponse.json(result.rows, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error('Error fetching favorite things:', err);
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
