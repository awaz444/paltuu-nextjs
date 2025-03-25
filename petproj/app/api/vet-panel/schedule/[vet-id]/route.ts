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

    if (!vet_id) {
        return NextResponse.json(
            { error: "Vet ID is required" },
            { status: 400 }
        );
    }

    try {
        await client.connect();
        const { availability } = await req.json();

        if (!Array.isArray(availability) || availability.length === 0) {
            return NextResponse.json(
                { error: "Availability array is required" },
                { status: 400 }
            );
        }

        // Fetch existing availability records
        const existingQuery = `
            SELECT availability_id, day_of_week FROM vet_availability WHERE vet_id = $1;
        `;
        const existingResult = await client.query(existingQuery, [vet_id]);
        const existingAvailability = existingResult.rows.reduce((acc, a) => {
            acc[a.day_of_week] = a.availability_id;
            return acc;
        }, {} as Record<string, number>);

        for (const slot of availability) {
            const { day_of_week, start_time, end_time } = slot;

            if (existingAvailability[day_of_week]) {
                // Update existing availability
                await client.query(
                    `UPDATE vet_availability 
                     SET start_time = $1, end_time = $2
                     WHERE vet_id = $3 AND day_of_week = $4;`,
                    [start_time, end_time, vet_id, day_of_week]
                );
            } else {
                // Insert new availability
                await client.query(
                    `INSERT INTO vet_availability (vet_id, day_of_week, start_time, end_time)
                     VALUES ($1, $2, $3, $4);`,
                    [vet_id, day_of_week, start_time, end_time]
                );
            }
        }

        // Fetch updated availability
        const updatedQuery = `
            SELECT availability_id, day_of_week, start_time, end_time 
            FROM vet_availability WHERE vet_id = $1;
        `;
        const updatedResult = await client.query(updatedQuery, [vet_id]);

        return NextResponse.json(
            { message: "Vet availability updated successfully", availability: updatedResult.rows },
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
