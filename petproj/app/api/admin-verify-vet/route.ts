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

        // Update the profile_verified field to true for the given vet_id
        const query = `WITH vet_update AS (
                UPDATE vets 
                SET approved = true 
                WHERE vet_id = $1 
                RETURNING user_id, vet_id
            )
            UPDATE users 
            SET role = 'vet' 
            FROM vet_update 
            WHERE users.user_id = vet_update.user_id 
            RETURNING users.*, vet_update.vet_id;
            `;
        const values = [vetId];
        const result = await client.query(query, values);

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: "Vet not found" },
                { status: 404 }
            );
        }

        const applicationUpdateQuery = "UPDATE vet_verification_application SET status = 'approved' WHERE vet_id = $1 AND status = 'pending' RETURNING *;";
        const applicationResult = await client.query(applicationUpdateQuery, values);

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
                message: "Vet profile verified successfully",
                vet: result.rows[0], // Return updated vet data
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: (error as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}