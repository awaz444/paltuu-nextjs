import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

export async function POST(
    req: NextRequest,
    { params }: { params: { foster_id: string } }
): Promise<NextResponse> {
    const client = createClient();
    const { foster_id } = params;

    if (!foster_id) {
        return NextResponse.json(
            { error: "Foster ID is required" },
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        await client.connect();

        // Start the transaction
        await client.query("BEGIN");

        // Step 1: Change the status of the specific foster application to 'approved'
        const updateFosterQuery = `
            UPDATE foster_applications
            SET status = 'approved'
            WHERE foster_id = $1
            RETURNING pet_id, user_id;
        `;
        const fosterResult = await client.query(updateFosterQuery, [foster_id]);

        if (fosterResult.rowCount === 0) {
            throw new Error("Foster application not found");
        }

        const { pet_id, user_id: approvedUserId } = fosterResult.rows[0];

        // Step 2: Change the pet's status to 'fostered'
        const updatePetQuery = `
            UPDATE pets
            SET adoption_status = 'fostered'
            WHERE pet_id = $1
            RETURNING pet_name;
        `;
        const petResult = await client.query(updatePetQuery, [pet_id]);

        if (petResult.rowCount === 0) {
            throw new Error("Pet not found");
        }

        const { pet_name: petName } = petResult.rows[0];

        // Step 3: Reject all other foster applications for the same pet_id
        const rejectOtherApplicationsQuery = `
            UPDATE foster_applications
            SET status = 'rejected'
            WHERE pet_id = $1 AND foster_id != $2
            RETURNING user_id;
        `;
        const rejectResult = await client.query(rejectOtherApplicationsQuery, [pet_id, foster_id]);

        // Step 4: Send notifications
        // Notification to the approved applicant
        const approvedNotificationQuery = `
            INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent)
            VALUES ($1, $2, $3, $4, $5);
        `;
        await client.query(approvedNotificationQuery, [
            approvedUserId,
            `Congratulations! Your foster application for ${petName} has been approved.`,
            'foster_approved',
            false,
            new Date()
        ]);

        // Notifications to all rejected applicants
        const rejectedNotificationQuery = `
            INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent)
            VALUES ($1, $2, $3, $4, $5);
        `;
        for (const row of rejectResult.rows) {
            const { user_id: rejectedUserId } = row;
            await client.query(rejectedNotificationQuery, [
                rejectedUserId,
                `Your foster application for ${petName} has been rejected.`,
                'foster_rejected',
                false,
                new Date()
            ]);
        }

        // Commit the transaction
        await client.query("COMMIT");

        return NextResponse.json(
            { message: "Foster application accepted and related updates completed successfully" },
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        // Rollback in case of any error
        await client.query("ROLLBACK");
        console.error("Transaction Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: (error as Error).message },
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        await client.end();
    }
}