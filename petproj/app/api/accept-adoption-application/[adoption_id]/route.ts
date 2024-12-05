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

        // Step 1: Change the status of the specific adoption application to 'accepted'
        const updateAdoptionQuery = `
            UPDATE adoption_applications
            SET status = 'approved'
            WHERE adoption_id = $1
            RETURNING pet_id;
        `;
        const adoptionResult = await client.query(updateAdoptionQuery, [adoption_id]);

        if (adoptionResult.rowCount === 0) {
            throw new Error("Adoption application not found");
        }

        const pet_id = adoptionResult.rows[0].pet_id;

        // Step 2: Change the pet's status to 'adopted'
        const updatePetQuery = `
            UPDATE pets
            SET adoption_status = 'adopted'
            WHERE pet_id = $1;
        `;
        await client.query(updatePetQuery, [pet_id]);

        // Step 3: Reject all other adoption applications for the same pet_id
        const rejectOtherApplicationsQuery = `
            UPDATE adoption_applications
            SET status = 'rejected'
            WHERE pet_id = $1 AND adoption_id != $2;
        `;
        await client.query(rejectOtherApplicationsQuery, [pet_id, adoption_id]);

        // Commit the transaction
        await client.query("COMMIT");

        return NextResponse.json(
            { message: "Adoption application accepted and related updates completed successfully" },
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
