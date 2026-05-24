import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

const ALLOWED_REASONS = [
    'SPAM', 'HATE_SPEECH', 'HARASSMENT', 'ANIMAL_ABUSE', 
    'MISINFORMATION', 'INAPPROPRIATE', 'SCAM', 'OTHER'
];

/**
 * POST /api/v1/posts/[id]/report
 * Report a post
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const reporterIdRaw = await getUserIdFromRequest(req);
        if (!reporterIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const reporterId = parseInt(String(reporterIdRaw), 10);
        
        const targetId = parseInt(params.id, 10);
        if (isNaN(targetId)) return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });

        const body = await req.json();
        const { reason_code, additional_note } = body;

        if (!ALLOWED_REASONS.includes(reason_code)) {
            return NextResponse.json({ error: "INVALID_REASON" }, { status: 400 });
        }

        // Check if post exists & owner isn't the reporter
        const postCheck = await db.query('SELECT user_id FROM social_posts WHERE post_id = $1', [targetId]);
        if (postCheck.rowCount === 0) {
            return NextResponse.json({ error: "POST_NOT_FOUND" }, { status: 404 });
        }
        if (postCheck.rows[0].user_id === reporterId) {
            return NextResponse.json({ error: "CANNOT_REPORT_SELF" }, { status: 403 });
        }

        // Insert report. If already reported, ignore silently
        await db.query(`
            INSERT INTO reports (reporter_id, target_type, target_id, reason_code, additional_note)
            VALUES ($1, 'post', $2, $3, $4)
            ON CONFLICT (reporter_id, target_type, target_id) DO NOTHING
        `, [reporterId, targetId, reason_code, additional_note || null]);

        return NextResponse.json({ reported: true });
    } catch (error) {
        console.error("Report Post POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
