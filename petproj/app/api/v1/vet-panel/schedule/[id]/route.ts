import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/vet-panel/schedule/{id}:
 *   get:
 *     summary: Get schedule for a vet (V1)
 *     tags: [v1 Professional]
 *   post:
 *     summary: Add new schedule slots (V1)
 *     tags: [v1 Professional]
 *   put:
 *     summary: Update existing schedule (V1)
 *     tags: [v1 Professional]
 *   delete:
 *     summary: Delete a schedule slot (V1)
 *     tags: [v1 Professional]
 */

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const vetId = params.id;

        const result = await db.query(`
            SELECT * FROM vet_availability WHERE vet_id = $1 ORDER BY 
                CASE 
                    WHEN day_of_week = 'Monday' THEN 1
                    WHEN day_of_week = 'Tuesday' THEN 2
                    WHEN day_of_week = 'Wednesday' THEN 3
                    WHEN day_of_week = 'Thursday' THEN 4
                    WHEN day_of_week = 'Friday' THEN 5
                    WHEN day_of_week = 'Saturday' THEN 6
                    WHEN day_of_week = 'Sunday' THEN 7
                END, start_time ASC
        `, [vetId]);

        return NextResponse.json(result.rows);

    } catch (error) {
        console.error("V1 Vet Schedule GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const vetId = params.id;
        const slots = await req.json(); // Array of { day_of_week, start_time, end_time }

        // Verify ownership
        const ownershipCheck = await db.query('SELECT user_id FROM vets WHERE vet_id = $1', [vetId]);
        if (ownershipCheck.rowCount === 0 || ownershipCheck.rows[0].user_id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await db.query('BEGIN');
        try {
            for (const slot of slots) {
                await db.query(`
                    INSERT INTO vet_availability (vet_id, day_of_week, start_time, end_time)
                    VALUES ($1, $2, $3, $4)
                `, [vetId, slot.day_of_week, slot.start_time, slot.end_time]);
            }
            await db.query('COMMIT');
            return NextResponse.json({ success: true });
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error("V1 Vet Schedule POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const vetId = params.id;
        const { availability } = await req.json();

        // Verify ownership
        const ownershipCheck = await db.query('SELECT user_id FROM vets WHERE vet_id = $1', [vetId]);
        if (ownershipCheck.rowCount === 0 || ownershipCheck.rows[0].user_id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await db.query('BEGIN');
        try {
            for (const slot of availability) {
                await db.query(`
                    UPDATE vet_availability SET 
                        day_of_week = $1,
                        start_time = $2,
                        end_time = $3
                    WHERE availability_id = $4 AND vet_id = $5
                `, [slot.day_of_week, slot.start_time, slot.end_time, slot.availability_id, vetId]);
            }
            await db.query('COMMIT');
            return NextResponse.json({ success: true });
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error("V1 Vet Schedule PUT error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const vetId = params.id;
        const { availability_id } = await req.json();

        // Verify ownership
        const ownershipCheck = await db.query('SELECT user_id FROM vets WHERE vet_id = $1', [vetId]);
        if (ownershipCheck.rowCount === 0 || ownershipCheck.rows[0].user_id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await db.query('DELETE FROM vet_availability WHERE availability_id = $1 AND vet_id = $2', [availability_id, vetId]);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("V1 Vet Schedule DELETE error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
