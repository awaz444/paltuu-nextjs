import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/admin/users/:id/suspend
 * Body: { suspended: boolean, reason?: string }
 *
 * Suspension is publicly visible (see app/api/v1/social/profile/[id]/route.ts
 * and the RN profile screen's "Account suspended" state) — the opposite of a
 * shadow-hide. It also blocks login (app/api/v1/auth/login and the OAuth
 * mobile callbacks) and new post/comment creation for anyone with an
 * already-issued token (lib/moderation.ts assertNotSuspended).
 *
 * Accounts land here either automatically — db/moderationBackfillSweep.ts
 * auto-suspends on a SEVERE match in name/username/bio — or manually, for
 * anything the report queue surfaces. This endpoint is also how a
 * false-positive gets reversed (suspended: false).
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const adminId = Number.isNaN(parseInt(String(admin.id), 10)) ? null : parseInt(String(admin.id), 10);

    try {
        const userId = params.id;
        const body = await req.json();
        const suspended: boolean = !!body.suspended;
        const reason: string | null = typeof body.reason === 'string' ? body.reason : null;

        const updated = await db.query(
            `UPDATE users
               SET is_suspended = $2,
                   suspension_reason = $3,
                   suspended_at = CASE WHEN $2 THEN NOW() ELSE NULL END
             WHERE user_id = $1
             RETURNING user_id, social_username, is_suspended`,
            [userId, suspended, suspended ? reason : null]
        );
        if ((updated.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await db.query(
            `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
             VALUES ($1, $2, $3, 'successful')`,
            [adminId, suspended ? `suspend_user:${reason || 'unspecified'}` : 'unsuspend_user', `user:${userId}`]
        );

        return NextResponse.json({ success: true, ...updated.rows[0] });
    } catch (error) {
        console.error("Admin suspend-user PATCH error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
