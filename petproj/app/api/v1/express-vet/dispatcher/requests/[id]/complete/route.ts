import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkDispatcher } from "@/lib/expressVet/dispatcherAuth";
import { ExpressVetNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/dispatcher/requests/{id}/complete:
 *   post:
 *     summary: Mark an assigned Vets at Home (Express Vet) request as completed (V1)
 *     tags: [v1 Express Vet]
 */
export async function POST(req: NextRequest, context: any) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = context?.params?.id;
  if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });
  const dispatcherId = Number(dispatcher.id || dispatcher.user_id);

  try {
    const roleFilter = dispatcher.role === "admin" ? "" : "AND assigned_by_dispatcher_id = $2";
    const params = dispatcher.role === "admin" ? [id] : [id, dispatcherId];

    const result = await db.query(
      `UPDATE express_vet_requests
       SET status = 'completed', completed_at = now()
       WHERE request_id = $1 AND status = 'assigned' ${roleFilter}
       RETURNING *`,
      params
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Cannot complete this request" }, { status: 409 });
    }

    const request = result.rows[0];
    await ExpressVetNotifications.onCompleted(request.client_user_id, id);

    return NextResponse.json({ request });
  } catch (error) {
    console.error("express-vet dispatcher complete POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
