import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, getUserFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/applications/foster/{id}:
 *   patch:
 *     summary: Update foster application status (V1)
 *     tags: [v1 Applications]
 */

export async function PATCH(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const id = req.nextUrl.pathname.split("/").pop();
        const body = await req.json();
        const { status } = body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const userId = user.user_id || user.id || user.sub;
        const isAdmin = user.role === 'admin';

        // 1. Verify Ownership
        const check = await db.query(`
            SELECT fa.user_id as applicant_id, p.owner_id, p.pet_name
            FROM foster_applications fa
            JOIN pets p ON fa.pet_id = p.pet_id
            WHERE fa.foster_id = $1
        `, [id]);

        if (check.rowCount === 0) return NextResponse.json({ error: "Application not found" }, { status: 404 });

        const { owner_id, applicant_id, pet_name } = check.rows[0];

        if (String(owner_id) !== String(userId) && !isAdmin) {
            return NextResponse.json({ error: "Forbidden. Only the pet owner can update application status." }, { status: 403 });
        }

        // 2. Update Status
        await db.query('BEGIN');
        try {
            const result = await db.query(`
                UPDATE foster_applications SET status = $1, updated_at = CURRENT_TIMESTAMP
                WHERE foster_id = $2 RETURNING *
            `, [status, id]);

            // 3. Notify Applicant
            await db.query(`
                INSERT INTO notifications (user_id, title, body, type, is_read, created_at, entity_type, entity_id)
                VALUES ($1, $2, $3, $4, false, NOW(), 'foster', $5)
            `, [
                applicant_id,
                'Foster Request Status Update',
                `Your foster request for ${pet_name} has been ${status}.`,
                'foster_application_update',
                id
            ]);

            await db.query('COMMIT');
            return NextResponse.json(result.rows[0]);
        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Foster PATCH error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
