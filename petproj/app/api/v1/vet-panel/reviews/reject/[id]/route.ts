import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/vet-panel/reviews/reject/{id}:
 *   delete:
 *     summary: Reject and delete a vet review (V1)
 *     tags: [v1 Professional]
 */

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const reviewId = params.id;

        // Verify ownership
        const ownershipCheck = await db.query(`
            SELECT v.user_id 
            FROM vet_reviews vr
            JOIN vets v ON vr.vet_id = v.vet_id
            WHERE vr.review_id = $1
        `, [reviewId]);

        if (ownershipCheck.rowCount === 0 || ownershipCheck.rows[0].user_id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await db.query('DELETE FROM vet_reviews WHERE review_id = $1', [reviewId]);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("V1 Vet Review Reject error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
