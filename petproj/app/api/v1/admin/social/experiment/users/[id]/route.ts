import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";
import { deterministicBucket } from "@/lib/feedExperiment";

export const dynamic = "force-dynamic";

const VALID = ['control', 'treatment', 'auto'];

/**
 * PATCH /api/v1/admin/social/experiment/users/:id
 * Body: { bucket: 'control' | 'treatment' | 'auto' }
 *
 * Move a user between A/B arms (full manual control):
 *   control|treatment -> explicit override (feed_experiment_assigned = true)
 *   auto              -> revert to the deterministic even/odd default
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const adminId = Number.isNaN(parseInt(String(admin.id), 10)) ? null : parseInt(String(admin.id), 10);

  try {
    const userId = parseInt(String(params.id), 10);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const body = await req.json();
    const bucket: string = body.bucket;
    if (!VALID.includes(bucket)) {
      return NextResponse.json({ error: `bucket must be one of ${VALID.join(', ')}` }, { status: 400 });
    }

    let updated;
    if (bucket === 'auto') {
      // Revert to the deterministic default; store it for visibility.
      updated = await db.query(
        `UPDATE users
           SET feed_experiment_assigned = false,
               feed_experiment_bucket = $2
         WHERE user_id = $1
         RETURNING user_id`,
        [userId, deterministicBucket(userId)]
      );
    } else {
      updated = await db.query(
        `UPDATE users
           SET feed_experiment_assigned = true,
               feed_experiment_bucket = $2
         WHERE user_id = $1
         RETURNING user_id`,
        [userId, bucket]
      );
    }

    if ((updated.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const effective = bucket === 'auto' ? deterministicBucket(userId) : bucket;
    await db.query(
      `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
       VALUES ($1, $2, $3, 'successful')`,
      [adminId, `assign_experiment_bucket:${bucket}`, `user:${userId}`]
    );

    return NextResponse.json({
      success: true,
      user_id: userId,
      assignment: bucket,
      effective_bucket: effective,
    });
  } catch (error) {
    console.error("Admin experiment user PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
