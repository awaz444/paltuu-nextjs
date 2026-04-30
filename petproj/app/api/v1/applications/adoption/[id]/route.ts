import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, getUserFromRequest } from "@/utils/authServer";
import { AdoptionNotifications } from "@/lib/notifications";

/**
 * @swagger
 * /api/v1/applications/adoption/{id}:
 *   patch:
 *     summary: Update adoption application status (V1)
 *     tags: [v1 Applications]
 */

export async function PATCH(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const id = req.nextUrl.pathname.split("/").pop();
        const body = await req.json();
        const { status } = body;

        if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
            return NextResponse.json({ error: "Invalid status or missing ID" }, { status: 400 });
        }

        const userId = user.user_id || user.id || user.sub;
        const isAdmin = user.role === 'admin';

        // 1. Verify Ownership
        const check = await db.query(`
            SELECT aa.user_id as applicant_id, p.owner_id, p.pet_name
            FROM adoption_applications aa
            JOIN pets p ON aa.pet_id = p.pet_id
            WHERE aa.adoption_id = $1
        `, [id]);

        if (check.rowCount === 0) return NextResponse.json({ error: "Application not found" }, { status: 404 });

        const { owner_id, applicant_id, pet_name } = check.rows[0] as {
            owner_id: number;
            applicant_id: number;
            pet_name: string;
        };

        if (String(owner_id) !== String(userId) && !isAdmin) {
            return NextResponse.json({ error: "Forbidden. Only the pet owner can update application status." }, { status: 403 });
        }

        // 2. Update Status
        await db.query('BEGIN');
        try {
            const result = await db.query(`
                UPDATE adoption_applications SET status = $1, updated_at = CURRENT_TIMESTAMP
                WHERE adoption_id = $2 RETURNING *
            `, [status, id]);

            // 3. Notify Applicant using new trigger system
            if (status === 'approved') {
                AdoptionNotifications.onApplicationApproved(
                    applicant_id,
                    parseInt(id),
                    pet_name
                ).catch(() => {});
            } else if (status === 'rejected') {
                AdoptionNotifications.onApplicationRejected(
                    applicant_id,
                    parseInt(id),
                    pet_name
                ).catch(() => {});
            }

            await db.query('COMMIT');
            return NextResponse.json(result.rows[0]);
        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Adoption PATCH error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
