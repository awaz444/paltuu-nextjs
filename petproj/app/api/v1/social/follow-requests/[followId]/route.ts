import { db, createClient } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { emitFollow, emitNotification } from "@/utils/realtimeEmitter";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import { SocialNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/social/follow-requests/[followId]
 * body: { action: "accept" | "reject" }
 * Only the request's recipient (following_id) may accept/reject it.
 */
export async function POST(req: NextRequest, { params }: { params: { followId: string } }) {
    try {
        const limited = await rateLimit(req, LIMITS.FOLLOW);
        if (limited) return limited;

        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const followId = params.followId;
        const body = await req.json().catch(() => ({}));
        const action = body?.action;

        if (action !== "accept" && action !== "reject") {
            return NextResponse.json({ error: "action must be 'accept' or 'reject'" }, { status: 400 });
        }

        const existing = await db.query(
            "SELECT follow_id, follower_id, following_id, status FROM social_follows WHERE follow_id = $1",
            [followId]
        );
        if (existing.rowCount === 0) {
            return NextResponse.json({ error: "Follow request not found" }, { status: 404 });
        }
        const request = existing.rows[0];

        if (request.following_id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (request.status !== "pending") {
            return NextResponse.json({ error: "Request already resolved" }, { status: 409 });
        }

        const client = createClient();
        await client.connect();
        await client.query('BEGIN');

        try {
            if (action === "accept") {
                await client.query(
                    "UPDATE social_follows SET status = 'accepted' WHERE follow_id = $1",
                    [followId]
                );
                await client.query(
                    "UPDATE users SET following_count = following_count + 1 WHERE user_id = $1",
                    [request.follower_id]
                );
                await client.query(
                    "UPDATE users SET follower_count = follower_count + 1 WHERE user_id = $1",
                    [request.following_id]
                );

                const accepterRes = await client.query(`SELECT name, profile_image_url FROM users WHERE user_id = $1`, [userId]);
                const accepter = accepterRes.rows[0];
                SocialNotifications.onFollowRequestAccepted(
                    request.follower_id,
                    userId,
                    accepter?.name || 'User',
                    accepter?.profile_image_url
                ).catch(() => {});

                await client.query('COMMIT');

                emitFollow(request.following_id, { follower_id: request.follower_id }).catch(() => {});
                emitNotification(request.follower_id, { type: 'social_follow_request_accepted', actor_id: userId }).catch(() => {});

                return NextResponse.json({ status: "accepted" });

            } else {
                // reject — just remove the pending row, no counts were ever incremented
                await client.query("DELETE FROM social_follows WHERE follow_id = $1", [followId]);
                await client.query('COMMIT');

                return NextResponse.json({ status: "rejected" });
            }
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            await client.end();
        }

    } catch (error) {
        console.error("V1 Follow Request Action POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * DELETE /api/v1/social/follow-requests/[followId]
 * Cancel a pending request — only the sender (follower_id) may cancel their own.
 */
export async function DELETE(req: NextRequest, { params }: { params: { followId: string } }) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const followId = params.followId;

        const existing = await db.query(
            "SELECT follow_id, follower_id, status FROM social_follows WHERE follow_id = $1",
            [followId]
        );
        if (existing.rowCount === 0) {
            return NextResponse.json({ error: "Follow request not found" }, { status: 404 });
        }
        const request = existing.rows[0];

        if (request.follower_id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (request.status !== "pending") {
            return NextResponse.json({ error: "Request already resolved" }, { status: 409 });
        }

        await db.query("DELETE FROM social_follows WHERE follow_id = $1", [followId]);

        return NextResponse.json({ status: "cancelled" });

    } catch (error) {
        console.error("V1 Follow Request Cancel DELETE error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
