import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { REPORT_REASONS } from "@/lib/moderation";

export const dynamic = "force-dynamic";

const ALLOWED_REASONS = REPORT_REASONS.map(r => r.code);

/**
 * POST /api/v1/comments/[id]/report
 * Report a comment
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const reporterIdRaw = await getUserIdFromRequest(req);
        if (!reporterIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const reporterId = parseInt(String(reporterIdRaw), 10);
        
        const targetId = parseInt(params.id, 10);
        if (isNaN(targetId)) return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });

        const body = await req.json().catch(() => ({}));
        const { reason_code, additional_note } = body;

        if (!ALLOWED_REASONS.includes(reason_code)) {
            return NextResponse.json({ error: "INVALID_REASON" }, { status: 400 });
        }

        // Check if comment exists
        const commentCheck = await db.query(
            "SELECT user_id FROM social_comments WHERE comment_id = $1 AND is_deleted = false",
            [targetId]
        );
        if (commentCheck.rowCount === 0) {
            return NextResponse.json({ error: "COMMENT_NOT_FOUND" }, { status: 404 });
        }

        const commentAuthorId = commentCheck.rows[0].user_id;
        if (commentAuthorId === reporterId) {
            return NextResponse.json({ error: "CANNOT_REPORT_SELF" }, { status: 403 });
        }

        // Insert report. If already reported, ignore silently
        await db.query(`
            INSERT INTO reports (reporter_id, target_type, target_id, reason_code, additional_note)
            VALUES ($1, 'comment', $2, $3, $4)
            ON CONFLICT (reporter_id, target_type, target_id) DO NOTHING
        `, [reporterId, targetId, reason_code, additional_note || null]);

        return NextResponse.json({ reported: true });
    } catch (error) {
        console.error("Report Comment POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
