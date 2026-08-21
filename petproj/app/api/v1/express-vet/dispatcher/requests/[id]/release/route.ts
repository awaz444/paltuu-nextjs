import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkDispatcher } from "@/lib/expressVet/dispatcherAuth";
import { emitExpressVetNewRequest } from "@/utils/realtimeEmitter";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/dispatcher/requests/{id}/release:
 *   post:
 *     summary: Release a claimed Vets at Home (Express Vet) request back to the pool (V1)
 *     tags: [v1 Express Vet]
 */
export async function POST(req: NextRequest, context: any) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = context?.params?.id;
  if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });
  const dispatcherId = Number(dispatcher.id || dispatcher.user_id);

  try {
    const body = await req.json().catch(() => ({}));
    const reason: string | null = body?.reason ?? null;

    // Only the dispatcher who holds the claim (or an admin) can release it — an admin
    // bypass matters here since a dispatcher stuck off-duty can't release their own claim.
    // The original claimer has to be read before the UPDATE, since RETURNING reflects the
    // post-update row (claimed_by_dispatcher_id already nulled out by then).
    const roleFilter = dispatcher.role === "admin" ? "" : "AND claimed_by_dispatcher_id = $2";
    const params = dispatcher.role === "admin" ? [id] : [id, dispatcherId];

    const existing = await db.query(`SELECT claimed_by_dispatcher_id FROM express_vet_requests WHERE request_id = $1`, [id]);
    const originalDispatcherId = existing.rows[0]?.claimed_by_dispatcher_id;

    const result = await db.query(
      `UPDATE express_vet_requests
       SET status = 'pending_dispatch', claimed_by_dispatcher_id = NULL, claimed_at = NULL
       WHERE request_id = $1 AND status = 'claimed' ${roleFilter}
       RETURNING *`,
      params
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Cannot release this request" }, { status: 409 });
    }

    await db.query(
      `UPDATE express_vet_claims
       SET released_at = now(), release_reason = $1
       WHERE request_id = $2 AND dispatcher_id = $3 AND released_at IS NULL`,
      [reason, id, originalDispatcherId]
    );

    await emitExpressVetNewRequest(result.rows[0]);

    return NextResponse.json({ request: result.rows[0] });
  } catch (error) {
    console.error("express-vet dispatcher release POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
