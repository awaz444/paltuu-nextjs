import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../db/index";

export async function POST(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const vet_id = req.nextUrl.pathname.split("/").pop();
    const { qualification_id, year_acquired, note } = await req.json();

    if (!vet_id || !qualification_id || !year_acquired) {
        return NextResponse.json(
            { error: "Vet ID, Qualification ID, and Year Acquired are required" },
            { status: 400 }
        );
    }

    try {
        await client.connect();

        const insertQuery = `
            INSERT INTO vet_qualifications (vet_id, qualification_id, year_acquired, note)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;

        const result = await client.query(insertQuery, [vet_id, qualification_id, year_acquired, note]);

        return NextResponse.json(
            { message: "Qualification added successfully", data: result.rows[0] },
            { status: 201 }
        );
    } catch (err) {
        console.error("Error adding qualification:", err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}


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
export async function PUT(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const vet_id = req.nextUrl.pathname.split("/").pop();

    if (!vet_id) {
        return NextResponse.json(
            { error: "Vet ID is required" },
            { status: 400 }
        );
    }

    try {
        await client.connect();
        const { qualifications } = await req.json();

        if (!Array.isArray(qualifications) || qualifications.length === 0) {
            return NextResponse.json(
                { error: "Qualifications array is required" },
                { status: 400 }
            );
        }

        // Fetch existing qualifications
        const existingQuery = `
            SELECT qualification_id FROM vet_qualifications WHERE vet_id = $1;
        `;
        const existingResult = await client.query(existingQuery, [vet_id]);
        const existingQualifications = existingResult.rows.map(q => q.qualification_id);

        for (const qual of qualifications) {
            const { qualification_id, year_acquired, note } = qual;

            if (existingQualifications.includes(qualification_id)) {
                // Update existing qualification
                await client.query(
                    `UPDATE vet_qualifications 
                     SET year_acquired = $1, note = $2
                     WHERE vet_id = $3 AND qualification_id = $4;`,
                    [year_acquired, note, vet_id, qualification_id]
                );
            } else {
                // Insert new qualification
                await client.query(
                    `INSERT INTO vet_qualifications (vet_id, qualification_id, year_acquired, note)
                     VALUES ($1, $2, $3, $4);`,
                    [vet_id, qualification_id, year_acquired, note]
                );
            }
        }

        // Fetch updated qualifications
        const updatedQuery = `
            SELECT vet_qualifications_id, qualification_id, year_acquired, note 
            FROM vet_qualifications WHERE vet_id = $1;
        `;
        const updatedResult = await client.query(updatedQuery, [vet_id]);

        return NextResponse.json(
            { message: "Vet qualifications updated successfully", qualifications: updatedResult.rows },
            { status: 200 }
        );
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const vet_id = req.nextUrl.pathname.split("/").pop();
    const { qualification_id } = await req.json();

    if (!vet_id || !qualification_id) {
        return NextResponse.json(
            { error: "Vet ID and Qualification ID are required" },
            { status: 400 }
        );
    }

    try {
        await client.connect();

        const deleteQuery = `
            DELETE FROM vet_qualifications
            WHERE vet_id = $1 AND qualification_id = $2;
        `;

        const result = await client.query(deleteQuery, [vet_id, qualification_id]);

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: "Qualification not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Qualification deleted successfully" },
            { status: 200 }
        );
    } catch (err) {
        console.error("Error deleting qualification:", err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}