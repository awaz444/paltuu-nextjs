/**
 * @swagger
 * /api/reject-adoption-application/[adoption_id]:
 *   post:
 *     summary: Auto-generated summary for /api/reject-adoption-application/[adoption_id]
 *     tags: [Auto-Generated]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

export async function POST(
    req: NextRequest,
    { params }: { params: { adoption_id: string } }
): Promise<NextResponse> {
    const client = createClient();
    const { adoption_id } = params;

    if (!adoption_id) {
        return NextResponse.json(
            { error: "Adoption ID is required" },
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        await client.connect();

        // Start the transaction
        await client.query("BEGIN");

        // Step 1: Change the status of the specific adoption application to 'rejected'
        const updateAdoptionQuery = `
            UPDATE adoption_applications
            SET status = 'rejected'
            WHERE adoption_id = $1
            RETURNING pet_id, user_id;
        `;
        const adoptionResult = await client.query(updateAdoptionQuery, [adoption_id]);

        if (adoptionResult.rowCount === 0) {
            throw new Error("Adoption application not found");
        }

        const { pet_id, user_id: rejectedUserId } = adoptionResult.rows[0];

        // Step 2: Get pet name for notification
        const petResult = await client.query(
            `SELECT pet_name FROM pets WHERE pet_id = $1`,
            [pet_id]
        );

        if (petResult.rowCount === 0) {
            throw new Error("Pet not found");
        }

        const { pet_name: petName } = petResult.rows[0];

        // Step 3: Send notification to rejected applicant
        const rejectedNotificationQuery = `
            INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent)
            VALUES ($1, $2, $3, $4, $5);
        `;
        await client.query(rejectedNotificationQuery, [
            rejectedUserId,
            `Your adoption application for ${petName} has been rejected.`,
            'adoption_rejected',
            false,
            new Date()
        ]);

        // Commit the transaction
        await client.query("COMMIT");

        return NextResponse.json(
            { message: "Adoption application rejected successfully" },
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