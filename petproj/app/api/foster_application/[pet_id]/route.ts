import { createClient } from '../../../../db/index'; 
import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch a single adoption application by pet_id
// GET: Fetch all foster applications by pet_id
export async function GET(req: NextRequest, { params }: { params: { pet_id: string } }): Promise<NextResponse> {
    const { pet_id } = params;  // Get pet_id from the dynamic route parameter

    if (!pet_id) {
        return NextResponse.json(
            { error: 'Pet ID is required' },
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const client = createClient();

    try {
        await client.connect();

        // Query to get all foster applications by pet_id
        const result = await client.query(
            `
            SELECT fa.*, p.pet_name
            FROM foster_applications fa
            JOIN pets p ON fa.pet_id = p.pet_id
            WHERE fa.pet_id = $1 AND fa.status = 'pending'
            ORDER BY fa.created_at DESC
            `,
            [pet_id]
        );
        

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Adoption application for this pet not found' },
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Return all rows as an array
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
