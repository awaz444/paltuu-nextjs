import { createClient } from "../../../db/index";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        const body = await req.json();
        const vetId = body.vet_id;

        if (!vetId) {
            return NextResponse.json(
                { error: "Vet ID is required" },
                { status: 400 }
            );
        }

        await client.connect();

        // Begin transaction
        await client.query("BEGIN");

        // Update the status in the vet_verification_application table
        const applicationUpdateQuery = `
            UPDATE vet_verification_application
            SET status = 'declined'
            WHERE vet_id = $1 AND status = 'pending'
            RETURNING *;
        `;
        const applicationResult = await client.query(applicationUpdateQuery, [vetId]);

        if (applicationResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return NextResponse.json(
                { error: "No pending verification applications found for the vet" },
                { status: 404 }
            );
        }

        // Commit transaction
        await client.query("COMMIT");

        return NextResponse.json(
            {
                message: "Vet verification application declined successfully",
                declinedApplications: applicationResult.rows, // Declined applications
            },
            { status: 200 }
        );
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Database Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: (error as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}