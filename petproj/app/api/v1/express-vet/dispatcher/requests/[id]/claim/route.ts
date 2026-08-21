import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkDispatcher } from "@/lib/expressVet/dispatcherAuth";
import { emitExpressVetClaimed } from "@/utils/realtimeEmitter";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/dispatcher/requests/{id}/claim:
 *   post:
 *     summary: Atomically claim a pending_dispatch Vets at Home (Express Vet) request (V1)
 *     tags: [v1 Express Vet]
 */
export async function POST(req: NextRequest, context: any) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = context?.params?.id;
  if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });
  const dispatcherId = Number(dispatcher.id || dispatcher.user_id);

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Single-writer-wins: zero rows back means someone else claimed it first.
    const claimResult = await client.query(
      `UPDATE express_vet_requests
       SET status = 'claimed', claimed_by_dispatcher_id = $1, claimed_at = now()
       WHERE request_id = $2 AND status = 'pending_dispatch'
       RETURNING *`,
      [dispatcherId, id]
    );

    if (claimResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "This request was already claimed" }, { status: 409 });
    }

    await client.query(
      `INSERT INTO express_vet_claims (request_id, dispatcher_id) VALUES ($1, $2)`,
      [id, dispatcherId]
    );

    await client.query("COMMIT");

    await emitExpressVetClaimed(id);

    return NextResponse.json({ request: claimResult.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("express-vet dispatcher claim POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    client.release();
  }
}
