import { createClient } from '../../../db/index'; 
import { NextRequest, NextResponse } from 'next/server';

// POST: Create a new adoption application
export async function POST(req: NextRequest): Promise<NextResponse> {
    const {
        user_id,
        pet_id,
        adopter_name,
        adopter_address,
        status,
        age_of_youngest_child,
        other_pets_details,
        other_pets_neutered,
        has_secure_outdoor_area,
        pet_sleep_location,
        pet_left_alone,
        additional_details,
        agree_to_terms,
    } = await req.json();

    const client = createClient();

    try {
        await client.connect();

        const result = await client.query(
            `INSERT INTO adoption_applications (
                user_id, pet_id, adopter_name, adopter_address, status, 
                age_of_youngest_child, other_pets_details, other_pets_neutered, 
                has_secure_outdoor_area, pet_sleep_location, pet_left_alone, 
                additional_details, agree_to_terms, created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP
            ) RETURNING *`,
            [
                user_id,
                pet_id,
                adopter_name,
                adopter_address,
                status || 'Pending',
                age_of_youngest_child,
                other_pets_details,
                other_pets_neutered,
                has_secure_outdoor_area,
                pet_sleep_location,
                pet_left_alone,
                additional_details,
                agree_to_terms,
            ]
        );

        return NextResponse.json(result.rows[0], {
            status: 201,
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

// GET: Fetch all adoption applications
export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        await client.connect();

        const result = await client.query('SELECT * FROM adoption_applications ORDER BY created_at DESC');

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

// PUT: Update an adoption application by ID
export async function PUT(req: NextRequest): Promise<NextResponse> {
    const {
        adoption_id,
        status,
        additional_details,
        other_fields_to_update, // Replace with actual fields as needed
    } = await req.json();

    const client = createClient();

    try {
        await client.connect();

        const result = await client.query(
            `UPDATE adoption_applications 
             SET status = $1, additional_details = $2, updated_at = CURRENT_TIMESTAMP
             WHERE adoption_id = $3 
             RETURNING *`,
            [status, additional_details, adoption_id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Adoption application not found' }, {
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

// DELETE: Delete an adoption application by ID
export async function DELETE(req: NextRequest): Promise<NextResponse> {
    const { adoption_id } = await req.json();

    const client = createClient();

    try {
        await client.connect();

        const result = await client.query(
            `DELETE FROM adoption_applications WHERE adoption_id = $1 RETURNING *`,
            [adoption_id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Adoption application not found' }, {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return NextResponse.json({ message: 'Adoption application deleted successfully' }, {
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
