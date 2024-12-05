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

        // Step 1: Change the status of the specific foster application to 'accepted'
        const updateFosterQuery = `
            UPDATE foster_applications
            SET status = 'approved'
            WHERE foster_id = $1
            RETURNING pet_id;
        `;
        const fosterResult = await client.query(updateFosterQuery, [foster_id]);

        if (fosterResult.rowCount === 0) {
            throw new Error("Foster application not found");
        }

        const pet_id = fosterResult.rows[0].pet_id;

        // Step 2: Change the pet's status to 'fostered'
        const updatePetQuery = `
            UPDATE pets
            SET adoption_status = 'fostered'
            WHERE pet_id = $1;
        `;
        await client.query(updatePetQuery, [pet_id]);

        // Step 3: Reject all other foster applications for the same pet_id
        const rejectOtherApplicationsQuery = `
            UPDATE foster_applications
            SET status = 'rejected'
            WHERE pet_id = $1 AND foster_id != $2;
        `;
        await client.query(rejectOtherApplicationsQuery, [pet_id, foster_id]);

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
