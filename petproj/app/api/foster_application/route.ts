    import { createClient } from '../../../db/index';
import { NextRequest, NextResponse } from 'next/server';

// POST: Create a new foster application
export async function POST(req: NextRequest): Promise<NextResponse> {
    const {
        user_id,
        pet_id,
        fosterer_name,
        fosterer_address,
        foster_start_date,
        foster_end_date,
        status,
        fostering_experience,
        age_of_youngest_child,
        other_pets_details,
        other_pets_neutered,
        has_secure_outdoor_area,
        pet_sleep_location,
        pet_left_alone,
        time_at_home,
        reason_for_fostering,
        additional_details,
        agree_to_terms,
    } = await req.json();

    const client = createClient();

    try {
        await client.connect();

        const result = await client.query(
            `INSERT INTO foster_applications (
                user_id, pet_id, fosterer_name, fosterer_address, foster_start_date, 
                foster_end_date, status, fostering_experience, age_of_youngest_child, 
                other_pets_details, other_pets_neutered, has_secure_outdoor_area, 
                pet_sleep_location, pet_left_alone, time_at_home, reason_for_fostering, 
                additional_details, agree_to_terms, created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP
            ) RETURNING *`,
            [
                user_id,
                pet_id,
                fosterer_name,
                fosterer_address,
                foster_start_date,
                foster_end_date,
                status || 'pending',
                fostering_experience,
                age_of_youngest_child,
                other_pets_details,
                other_pets_neutered,
                has_secure_outdoor_area,
                pet_sleep_location,
                pet_left_alone,
                time_at_home,
                reason_for_fostering,
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

// GET: Fetch all foster applications
export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        await client.connect();

        const result = await client.query(`SELECT * FROM foster_applications WHERE status='pending' ORDER BY created_at DESC`);

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

// PUT: Update a foster application by ID
export async function PUT(req: NextRequest): Promise<NextResponse> {
    const {
        foster_id,
        status,
        additional_details,
        other_fields_to_update, // Replace with actual fields as needed
    } = await req.json();

    const client = createClient();

    try {
        await client.connect();

        const result = await client.query(
            `UPDATE foster_applications 
             SET status = $1, additional_details = $2, updated_at = CURRENT_TIMESTAMP
             WHERE foster_id = $3 
             RETURNING *`,
            [status, additional_details, foster_id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Foster application not found' }, {
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

// DELETE: Delete a foster application by ID
export async function DELETE(req: NextRequest): Promise<NextResponse> {
    const { foster_id } = await req.json();

    const client = createClient();

    try {
        await client.connect();

        const result = await client.query(
            `DELETE FROM foster_applications WHERE foster_id = $1 RETURNING *`,
            [foster_id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Foster application not found' }, {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return NextResponse.json({ message: 'Foster application deleted successfully' }, {
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