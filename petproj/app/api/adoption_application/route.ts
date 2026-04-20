/**
 * @swagger
 * /api/adoption_application:
 *   get:
 *     summary: Fetch all pending adoption applications
 *     tags: [Adoptions]
 *   post:
 *     summary: Submit a new adoption application
 *     tags: [Adoptions]
 *   put:
 *     summary: Update an adoption application (e.g., status or details)
 *     tags: [Adoptions]
 *   delete:
 *     summary: Delete an adoption application
 *     tags: [Adoptions]
 */

import { getUserIdFromRequest } from '../../../utils/authServer';

// POST: Create a new adoption application
export async function POST(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const {
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
    } = body;

    const auth_user_id = await getUserIdFromRequest(req);
    if (!auth_user_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = createClient();

    try {
        await client.connect();
        await client.query('BEGIN');  // Start transaction

        // 1. Insert adoption application
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
                auth_user_id,
                pet_id,
                adopter_name,
                adopter_address,
                status || 'pending',
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

        // 2. Get pet owner details
        const petResult = await client.query(
            `SELECT owner_id, pet_name FROM pets WHERE pet_id = $1`,
            [pet_id]
        );

        if (petResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json(
                { error: 'Pet not found' },
                { status: 404 }
            );
        }

        const { owner_id: ownerId, pet_name: petName } = petResult.rows[0];

        // 3. Get owner and applicant details for emails
        const ownerDetailsResult = await client.query(
            `SELECT name, email FROM users WHERE user_id = $1`,
            [ownerId]
        );

        const applicantDetailsResult = await client.query(
            `SELECT email FROM users WHERE user_id = $1`,
            [user_id]
        );

        const ownerDetails = ownerDetailsResult.rows[0] || {};
        const applicantDetails = applicantDetailsResult.rows[0] || {};

        // 4. Create notifications
        // Notification to applicant
        await client.query(
            `INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                auth_user_id,
                `Your adoption application for ${petName} has been submitted successfully! The owner will review your application.`,
                'application_submission',
                false,
                new Date()
            ]
        );

        // Notification to pet owner
        await client.query(
            `INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                ownerId,
                `New adoption application received for ${petName}! Please review the details.`,
                'new_application',
                false,
                new Date()
            ]
        );

        await client.query('COMMIT');

        // 5. Send emails to admin and pet owner (non-blocking)
        try {
            sendAdoptionApplicationEmails({
                pet_name: petName,
                pet_id: pet_id,
                adopter_name: adopter_name,
                adopter_email: applicantDetails.email,
                owner_email: ownerDetails.email,
                owner_name: ownerDetails.name,
                application_id: result.rows[0].adoption_id,
            }).catch((err) => console.warn('Failed to send adoption application emails', err));
        } catch (e) {
            console.warn('Email send scheduling failed', e);
        }

        return NextResponse.json(result.rows[0], {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        await client.query('ROLLBACK').catch(console.error);
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

        const result = await client.query(`SELECT * FROM adoption_applications WHERE status='pending' ORDER BY created_at DESC`);

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
