import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { REPORT_REASONS } from "@/lib/moderation";

export const dynamic = "force-dynamic";

const ALLOWED_REASONS = REPORT_REASONS.map(r => r.code);

/**
 * POST /api/v1/users/[id]/report
 * Report a user
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const reporterIdRaw = await getUserIdFromRequest(req);
        if (!reporterIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const reporterId = parseInt(String(reporterIdRaw), 10);
        
        const targetId = parseInt(params.id, 10);
        if (isNaN(targetId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });

        const body = await req.json();
        const { reason_code, additional_note } = body;

        if (!ALLOWED_REASONS.includes(reason_code)) {
            return NextResponse.json({ error: "INVALID_REASON" }, { status: 400 });
        }

        if (reporterId === targetId) {
            return NextResponse.json({ error: "CANNOT_REPORT_SELF" }, { status: 403 });
        }

        // Check if user exists
        const userCheck = await db.query('SELECT user_id FROM users WHERE user_id = $1', [targetId]);
        if (userCheck.rowCount === 0) {
            return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
        }

        // Insert report. If already reported, ignore silently
        await db.query(`
            INSERT INTO reports (reporter_id, target_type, target_id, reason_code, additional_note)
            VALUES ($1, 'user', $2, $3, $4)
            ON CONFLICT (reporter_id, target_type, target_id) DO NOTHING
        `, [reporterId, targetId, reason_code, additional_note || null]);

        return NextResponse.json({ reported: true });
    } catch (error) {
        console.error("Report User POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
