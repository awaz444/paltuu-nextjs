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

        // Update the status of the adoption application to "rejected"
        const query = `
            UPDATE adoption_applications
            SET status = 'rejected'
            WHERE adoption_id = $1
            RETURNING adoption_id, status;
        `;

        const result = await client.query(query, [adoption_id]);

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: "Adoption application not found or already updated" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const updatedApplication = result.rows[0];

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
