import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const user_id = req.nextUrl.pathname.split("/").pop();

    if (!user_id) {
        return NextResponse.json(
            { error: "User ID is required" },
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    try {
        await client.connect();

        // Query to get the vet_id for the given user_id
        const vetQuery = `
            SELECT vet_id
            FROM vets
            WHERE user_id = $1
            LIMIT 1;
        `;

        const vetResult = await client.query(vetQuery, [user_id]);

        if (vetResult.rows.length === 0) {
            return NextResponse.json(
                { error: "No vet found for the given user ID" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const vet_id = vetResult.rows[0].vet_id;

        // Query to get qualifications associated with the vet_id
        const query = `
            SELECT 
                vq.qualification_id,
                vq.year_acquired,
                vq.note,
                q.qualification_name
            FROM vet_qualifications vq
            JOIN qualifications q ON vq.qualification_id = q.qualification_id
            WHERE vq.vet_id = $1;
        `;

        const result = await client.query(query, [vet_id]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "No qualifications found for this vet" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const qualifications = result.rows.map((row) => ({
            qualification_id: row.qualification_id,
            qualification_name: row.qualification_name,
            year_acquired: row.year_acquired,
            note: row.note,
        }));

        return NextResponse.json(
            { user_id, qualifications },
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
        await client.end();
    }
}
