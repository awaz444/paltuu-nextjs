import { createClient } from '../../../db/index';
import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch all vet specializations or a specific one by ID
export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    try {
        await client.connect();

        if (id) {
            const result = await client.query(
                'SELECT * FROM vet_specializations WHERE id = $1',
                [id]
            );
            if (result.rows.length === 0) {
                return NextResponse.json({ error: 'Specialization not found' }, { status: 404 });
            }
            return NextResponse.json(result.rows[0], { status: 200 });
        } else {
            const result = await client.query('SELECT * FROM vet_specializations');
            return NextResponse.json(result.rows, { status: 200 });
        }
    } catch (err) {
        console.error('Error fetching vet specializations:', err);
        return NextResponse.json(
            { error: 'Internal Server Error', message: (err as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}

// POST: Add a new vet specialization
export async function POST(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const { vet_id, category_id } = await req.json();

    if (!vet_id || !category_id) {
        return NextResponse.json(
            { error: 'Vet ID and Category ID are required' },
            { status: 400 }
        );
    }

    try {
        await client.connect();
        const result = await client.query(
            `INSERT INTO vet_specializations (vet_id, category_id)
             VALUES ($1, $2) RETURNING *`,
            [vet_id, category_id]
        );
        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (err) {
        console.error('Error creating vet specialization:', err);
        return NextResponse.json(
            { error: 'Internal Server Error', message: (err as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}

// PUT: Update a vet specialization
export async function PUT(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const { vet_id, category_id } = await req.json();

    if (!id) {
        return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
    }

    try {
        await client.connect();
        const result = await client.query(
            `UPDATE vet_specializations
             SET vet_id = COALESCE($1, vet_id), 
                 category_id = COALESCE($2, category_id)
             WHERE id = $3 RETURNING *`,
            [vet_id || null, category_id || null, id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Specialization not found' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0], { status: 200 });
    } catch (err) {
        console.error('Error updating vet specialization:', err);
        return NextResponse.json(
            { error: 'Internal Server Error', message: (err as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}

// DELETE: Remove a vet specialization
export async function DELETE(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required for deletion' }, { status: 400 });
    }

    try {
        await client.connect();
        const result = await client.query(
            'DELETE FROM vet_specializations WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Specialization not found' }, { status: 404 });
        }

        return NextResponse.json(
            { message: 'Specialization deleted successfully', specialization: result.rows[0] },
            { status: 200 }
        );
    } catch (err) {
        console.error('Error deleting vet specialization:', err);
        return NextResponse.json(
            { error: 'Internal Server Error', message: (err as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}
