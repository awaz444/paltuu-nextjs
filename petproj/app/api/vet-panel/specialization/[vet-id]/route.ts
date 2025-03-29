import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../db/index";

export async function POST(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const vet_id = req.nextUrl.pathname.split("/").pop();
    const { category_id } = await req.json();

    if (!vet_id || !category_id) {
        return NextResponse.json(
            { error: "Vet ID and Category ID are required" },
            { status: 400 }
        );
    }

    try {
        await client.connect();

        const insertQuery = `
            INSERT INTO vet_specializations (vet_id, category_id)
            VALUES ($1, $2)
            RETURNING *;
        `;

        const result = await client.query(insertQuery, [vet_id, category_id]);

        return NextResponse.json(
            { message: "Specialization added successfully", data: result.rows[0] },
            { status: 201 }
        );
    } catch (err) {
        console.error("Error adding specialization:", err);
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
                vs.vet_id, 
                vs.category_id, 
                pc.category_name
            FROM vet_specializations vs
            JOIN pet_category pc ON vs.category_id = pc.category_id
            WHERE vs.vet_id = $1;
        `;

        const result = await client.query(query, [vet_id]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "No specializations found for this vet" },
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
    const { specializations } = await req.json();

    if (!vet_id || !Array.isArray(specializations)) {
        return NextResponse.json(
            { error: "Invalid request. Vet ID and specializations data are required" },
            { status: 400 }
        );
    }

    try {
        await client.connect();

        // Get existing specializations for the vet
        const existingQuery = `
            SELECT category_id FROM vet_specializations WHERE vet_id = $1;
        `;
        const existingResult = await client.query(existingQuery, [vet_id]);
        const existingSpecializations = new Set(existingResult.rows.map(row => row.category_id));

        // Insert only new specializations
        const insertQuery = `
            INSERT INTO vet_specializations (vet_id, category_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING;
        `;

        for (const category_id of specializations) {
            if (!existingSpecializations.has(category_id)) {
                await client.query(insertQuery, [vet_id, category_id]);
            }
        }

        // Fetch updated specializations
        const updatedQuery = `
            SELECT vs.vet_id, vs.category_id, pc.category_name
            FROM vet_specializations vs
            JOIN pet_category pc ON vs.category_id = pc.category_id
            WHERE vs.vet_id = $1;
        `;
        const updatedResult = await client.query(updatedQuery, [vet_id]);

        return NextResponse.json(
            {
                message: "Vet specializations updated successfully",
                specializations: updatedResult.rows
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("Error updating vet specializations:", err);
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
    const { category_id } = await req.json();

    if (!vet_id || !category_id) {
        return NextResponse.json(
            { error: "Vet ID and Category ID are required" },
            { status: 400 }
        );
    }

    try {
        await client.connect();

        const deleteQuery = `
            DELETE FROM vet_specializations
            WHERE vet_id = $1 AND category_id = $2;
        `;

        const result = await client.query(deleteQuery, [vet_id, category_id]);

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: "Specialization not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Specialization deleted successfully" },
            { status: 200 }
        );
    } catch (err) {
        console.error("Error deleting specialization:", err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}