import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../db/index";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const vet_id = req.nextUrl.pathname.split("/").pop();

    if (!vet_id) {
        return NextResponse.json(
            { error: "Vet ID is required" },
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    try {
        await client.connect();

        const query = `
            SELECT 
                vq.vet_qualifications_id,
                vq.vet_id,
                vq.qualification_id,
                q.qualification_name,
                vq.year_acquired,
                vq.note
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

        return NextResponse.json(result.rows, {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
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
