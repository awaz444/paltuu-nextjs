import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/vet-panel/clinic-details/{id}:
 *   get:
 *     summary: Get clinic details for a vet (V1)
 *     tags: [v1 Professional]
 *   put:
 *     summary: Update clinic details for a vet (V1)
 *     tags: [v1 Professional]
 */

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const vetId = params.id;

        const result = await db.query(`
            SELECT * FROM vets WHERE vet_id = $1
        `, [vetId]);

        if ((result.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "Clinic details not found" }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);

    } catch (error) {
        console.error("V1 Vet Clinic GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const vetId = params.id;
        const body = await req.json();

        // Verify that this user owns this vet profile
        const ownershipCheck = await db.query('SELECT user_id FROM vets WHERE vet_id = $1', [vetId]);
        if (ownershipCheck.rowCount === 0 || ownershipCheck.rows[0].user_id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { 
            clinic_name, 
            location, 
            minimum_fee, 
            contact_details, 
            clinic_whatsapp, 
            clinic_email,
            bio
        } = body;

        const result = await db.query(`
            UPDATE vets SET 
                clinic_name = COALESCE($1, clinic_name),
                location = COALESCE($2, location),
                minimum_fee = COALESCE($3, minimum_fee),
                contact_details = COALESCE($4, contact_details),
                clinic_whatsapp = COALESCE($5, clinic_whatsapp),
                clinic_email = COALESCE($6, clinic_email),
                bio = COALESCE($7, bio)
            WHERE vet_id = $8
            RETURNING *
        `, [clinic_name, location, minimum_fee, contact_details, clinic_whatsapp, clinic_email, bio, vetId]);

        return NextResponse.json(result.rows[0]);

    } catch (error) {
        console.error("V1 Vet Clinic PUT error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
