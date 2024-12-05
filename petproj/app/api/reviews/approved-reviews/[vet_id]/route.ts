import { createClient } from '../../../../../db/index'; 
import { NextRequest, NextResponse } from 'next/server';

// GET method to fetch approved reviews for a specific vet_id
export async function GET(req: NextRequest, { params }: { params: { vet_id: string } }): Promise<NextResponse> {
    const client = createClient();
    const { vet_id } = params;

    try {
        await client.connect();
        const result = await client.query(`
            SELECT review_id, user_id, rating, review_content, review_date
            FROM vet_reviews
            WHERE vet_id = $1 AND approved = true
            ORDER BY review_date DESC
        `, [vet_id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ message: 'No approved reviews found for this vet' }, { status: 404 });
        }

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
