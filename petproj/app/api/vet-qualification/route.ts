import { createClient } from "../../../db/index";
import { NextRequest, NextResponse } from "next/server";

// POST method to add a vet qualification
export async function POST(req: NextRequest): Promise<NextResponse> {
    const { vet_id, qualification_id, year_acquired, note } = await req.json();
    const client = createClient();

    try {
        await client.connect(); // Connect to the database

        if (!vet_id || !qualification_id || !year_acquired || !note) {
            return NextResponse.json(
                { error: "All fields are required: vet_id, qualification_id, year_acquired, note." },
                { status: 400 }
            );
        }

        const result = await client.query(
            `INSERT INTO vet_qualifications 
                (vet_id, qualification_id, year_acquired, note) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [vet_id, qualification_id, year_acquired, note]
        );

        return NextResponse.json(result.rows[0], {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end(); // Always close the connection
    }
}

// GET method to fetch qualifications of vets
export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        await client.connect(); // Connect to the database

        const result = await client.query(
            `SELECT 
                vet_qualifications.*, 
                vets.vet_id, 
                qualifications.qualification_name 
             FROM vet_qualifications
             JOIN vets ON vet_qualifications.vet_id = vets.vet_id
             JOIN qualifications ON vet_qualifications.qualification_id = qualifications.qualification_id
             ORDER BY vet_qualifications.vet_id, vet_qualifications.year_acquired DESC`
        );

        return NextResponse.json(result.rows, {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end(); // Always close the connection
    }
}
