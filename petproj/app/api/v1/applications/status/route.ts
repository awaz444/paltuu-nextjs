import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { AdoptionNotifications } from "@/lib/notifications";

/**
 * @swagger
 * /api/v1/applications/status:
 *   put:
 *     summary: Update application status (Adoption/Foster) with ownership check (V1 Hardened)
 *     tags: [v1 Applications]
 */

export async function PUT(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { application_id, type, status } = body; // type: 'adoption' | 'foster', status: 'approved' | 'rejected'

        if (!application_id || !type || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const tableName = type === 'adoption' ? 'adoption_applications' : 'foster_applications';
        const idCol = type === 'adoption' ? 'adoption_id' : 'foster_id';

        // 1. Verify Ownership & Get Details
        const appRes = await db.query(`
            SELECT a.*, p.owner_id, p.pet_name, p.pet_id
            FROM ${tableName} a
            JOIN pets p ON a.pet_id = p.pet_id
            WHERE a.${idCol} = $1
        `, [application_id]);

        if (appRes.rowCount === 0) return NextResponse.json({ error: "Application not found" }, { status: 404 });
        const application = appRes.rows[0];

        if (application.owner_id !== userId) {
            return NextResponse.json({ error: "Forbidden: You do not own this pet" }, { status: 403 });
        }

        // 2. Start Update Process
        if (status === 'approved') {
            // Approve this one
            await db.query(`UPDATE ${tableName} SET status = 'approved', updated_at = NOW() WHERE ${idCol} = $1`, [application_id]);

            // Update Pet Status
            const petStatus = type === 'adoption' ? 'adopted' : 'fostered';
            await db.query(`UPDATE pets SET adoption_status = $1 WHERE pet_id = $2`, [petStatus, application.pet_id]);

            // Reject Others
            const rejectResult = await db.query(`
                UPDATE ${tableName} SET status = 'rejected', updated_at = NOW()
                WHERE pet_id = $1 AND ${idCol} != $2
                RETURNING user_id
            `, [application.pet_id, application_id]);

            // Notifications - using new trigger system
            AdoptionNotifications.onApplicationApproved(
                application.user_id,
                application_id,
                application.pet_name
            ).catch(() => {});

            // Reject others
            for (const row of rejectResult.rows) {
                AdoptionNotifications.onApplicationRejected(
                    row.user_id,
                    application_id,
                    application.pet_name
                ).catch(() => {});
            }
        } else {
            // Just reject this one
            await db.query(`UPDATE ${tableName} SET status = 'rejected', updated_at = NOW() WHERE ${idCol} = $1`, [application_id]);

            AdoptionNotifications.onApplicationRejected(
                application.user_id,
                application_id,
                application.pet_id,
                application.pet_name
            ).catch(() => {});
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("V1 Application Status Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
