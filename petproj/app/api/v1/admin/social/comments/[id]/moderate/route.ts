import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";

export const dynamic = "force-dynamic";

const VALID_STATES = ['none', 'shadow_hidden', 'redacted'];

/**
 * PATCH /api/v1/admin/social/comments/:id/moderate
 * Body: { state: 'none' | 'shadow_hidden' | 'redacted' }
 *
 * Mirrors the post moderate endpoint (see
 * app/api/v1/admin/social/posts/[id]/moderate/route.ts) but scoped to what a
 * comment actually needs:
 *   shadow_hidden -> is_shadow_hidden = true (dropped for everyone except
 *                    the author, whose thread looks unchanged — see
 *                    lib/moderationRedaction.ts)
 *   redacted      -> is_shadow_hidden stays false — the comment stays
 *                    visible to everyone, but lib/moderationRedaction.ts
 *                    covers the SEVERE word(s) with a grey chip on read
 *                    (see lib/moderation/badWords.ts redactSevereWords).
 *                    Use this instead of shadow_hidden when the rest of the
 *                    comment is fine and only needs the slur covered.
 *   none          -> restore, nothing hidden or redacted
 * A full "hidden" state isn't offered here — comments already have a
 * hard-hide mechanism (DELETE /api/v1/social/comments/:id, which
 * soft-deletes the comment and cascades to its replies), and that's a
 * different, more destructive operation than the states this endpoint
 * manages.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const adminId = Number.isNaN(parseInt(String(admin.id), 10)) ? null : parseInt(String(admin.id), 10);

    try {
        const commentId = params.id;
        const body = await req.json();
        const state: string = body.state;

        if (!VALID_STATES.includes(state)) {
            return NextResponse.json({ error: `state must be one of ${VALID_STATES.join(', ')}` }, { status: 400 });
        }

        const isShadowHidden = state === 'shadow_hidden';

        const updated = await db.query(
            `UPDATE social_comments
               SET moderation_state = $2, is_shadow_hidden = $3
             WHERE comment_id = $1 AND is_deleted = false
             RETURNING comment_id`,
            [commentId, state, isShadowHidden]
        );
        if ((updated.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        await db.query(
            `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
             VALUES ($1, $2, $3, 'successful')`,
            [adminId, `moderate_comment:${state}`, `comment:${commentId}`]
        );

        return NextResponse.json({ success: true, moderation_state: state });
    } catch (error) {
        console.error("Admin moderate-comment PATCH error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
