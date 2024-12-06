import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

export async function DELETE(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const { pathname } = req.nextUrl;
    const applicationId = pathname.split('/').pop(); // Extract the application ID from the URL

    if (!applicationId) {
        return NextResponse.json(
            { error: "Application ID is required" },
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    const [type, id] = applicationId.split('_'); // Split ID to determine foster or adoption type
    if (!id || (type !== "foster" && type !== "adoption")) {
        return NextResponse.json(
            { error: "Invalid application ID" },
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    try {
        await client.connect();

        let deleteQuery;
        if (type === "foster") {
            deleteQuery = `
                DELETE FROM foster_applications
                WHERE foster_id = $1
                RETURNING *;
            `;
        } else {
            deleteQuery = `
                DELETE FROM adoption_applications
                WHERE adoption_id = $1
                RETURNING *;
            `;
        }

        const result = await client.query(deleteQuery, [id]);

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: `${type.charAt(0).toUpperCase() + type.slice(1)} application not found` },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Return a success response with the deleted application data
        return NextResponse.json(
            {
                message: `${type.charAt(0).toUpperCase() + type.slice(1)} application deleted successfully.`,
                deletedApplication: result.rows[0],
            },
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    } finally {
        await client.end(); // Close the database connection
    }
}
