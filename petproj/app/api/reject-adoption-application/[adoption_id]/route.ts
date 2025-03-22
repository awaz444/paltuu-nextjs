import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

export async function POST(req: NextRequest, { params }: { params: { adoption_id: string } }): Promise<NextResponse> {
    const client = createClient();

    // Extract adoption_id from the dynamic route parameter
    const { adoption_id } = params;

    if (!adoption_id) {
        return NextResponse.json(
            { error: "Adoption ID is required" },
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    try {
        await client.connect();
        await client.query('BEGIN'); // Start transaction

        // 1. Update the status of the adoption application to "rejected"
        const updateQuery = `
            UPDATE adoption_applications
            SET status = 'rejected'
            WHERE adoption_id = $1
            RETURNING adoption_id, status, user_id, pet_id;
        `;

        const updateResult = await client.query(updateQuery, [adoption_id]);

        if (updateResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json(
                { error: "Adoption application not found or already updated" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const updatedApplication = updateResult.rows[0];
        const { user_id: applicantId, pet_id: petId } = updatedApplication;

        // 2. Fetch pet details (pet name) for the notification
        const petQuery = `
            SELECT pet_name FROM pets WHERE pet_id = $1;
        `;

        const petResult = await client.query(petQuery, [petId]);

        if (petResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json(
                { error: "Pet not found" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const { pet_name: petName } = petResult.rows[0];

        // 3. Create a notification for the applicant
        const notificationQuery = `
            INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent)
            VALUES ($1, $2, $3, $4, $5);
        `;

        await client.query(notificationQuery, [
            applicantId,
            `Your adoption application for ${petName} has been rejected.`,
            'adoption_rejected',
            false,
            new Date()
        ]);

        await client.query('COMMIT'); // Commit transaction

        return NextResponse.json(
            {
                message: "Adoption application status updated successfully",
                application: updatedApplication,
            },
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        await client.query('ROLLBACK').catch(console.error);
        console.error("Database Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: (error as Error).message },
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    } finally {
        await client.end();
    }
}