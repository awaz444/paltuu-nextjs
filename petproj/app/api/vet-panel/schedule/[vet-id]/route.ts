import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../db/index";

export async function POST(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const vet_id = req.nextUrl.pathname.split("/").pop();
    const { day_of_week, start_time, end_time } = await req.json();

    if (!vet_id || !day_of_week || !start_time || !end_time) {
        return NextResponse.json(
            { error: "Vet ID, Day of Week, Start Time, and End Time are required" },
            { status: 400 }
        );
    }

    try {
        await client.connect();

        const insertQuery = `
            INSERT INTO vet_availability (vet_id, day_of_week, start_time, end_time)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;

        const result = await client.query(insertQuery, [vet_id, day_of_week, start_time, end_time]);

        return NextResponse.json(
            { message: "Availability slot added successfully", data: result.rows[0] },
            { status: 201 }
        );
    } catch (err) {
        console.error("Error adding availability slot:", err);
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
                availability_id,
                vet_id,
                day_of_week,
                start_time,
                end_time
            FROM vet_availability
            WHERE vet_id = $1;
        `;

        const result = await client.query(query, [vet_id]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "No availability found for this vet" },
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
    const { availability } = await req.json();

    if (!vet_id || !Array.isArray(availability)) {
        return NextResponse.json(
            { error: "Invalid request. Vet ID and availability data are required" },
            { status: 400 }
        );
    }

    try {
        await client.connect();

        for (const slot of availability) {
            const { availability_id, day_of_week, start_time, end_time } = slot;

            if (!day_of_week || !start_time || !end_time) {
                return NextResponse.json(
                    { error: "Missing required fields: day_of_week, start_time, end_time" },
                    { status: 400 }
                );
            }

            if (availability_id) {
                // Update existing slot
                const updateQuery = `
                    UPDATE vet_availability
                    SET day_of_week = $1, start_time = $2, end_time = $3
                    WHERE availability_id = $4 AND vet_id = $5;
                `;
                await client.query(updateQuery, [day_of_week, start_time, end_time, availability_id, vet_id]);
            } else {
                // Insert new slot
                const insertQuery = `
                    INSERT INTO vet_availability (vet_id, day_of_week, start_time, end_time)
                    VALUES ($1, $2, $3, $4);
                `;
                await client.query(insertQuery, [vet_id, day_of_week, start_time, end_time]);
            }
        }

        // Fetch updated availability data
        const updatedAvailabilityQuery = `
            SELECT availability_id, day_of_week, start_time, end_time
            FROM vet_availability
            WHERE vet_id = $1
            ORDER BY day_of_week, start_time;
        `;
        const updatedAvailabilityResult = await client.query(updatedAvailabilityQuery, [vet_id]);

        return NextResponse.json(
            {
                message: "Vet availability updated successfully",
                availability: updatedAvailabilityResult.rows
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("Error updating vet availability:", err);
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
    const { availability_id } = await req.json();

    if (!vet_id || !availability_id) {
        return NextResponse.json(
            { error: "Vet ID and Availability ID are required" },
            { status: 400 }
        );
    }

    try {
        await client.connect();

        const deleteQuery = `
            DELETE FROM vet_availability
            WHERE vet_id = $1 AND availability_id = $2;
        `;

        const result = await client.query(deleteQuery, [vet_id, availability_id]);

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: "Availability slot not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Availability slot deleted successfully" },
            { status: 200 }
        );
    } catch (err) {
        console.error("Error deleting availability:", err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}