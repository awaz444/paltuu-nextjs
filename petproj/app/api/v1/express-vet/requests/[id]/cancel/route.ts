import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/requests/{id}/cancel:
 *   post:
 *     summary: Client-cancel a Vets at Home (Express Vet) request while it's still pending or claimed (V1)
 *     tags: [v1 Express Vet]
 */
export async function POST(req: NextRequest, context: any) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = context?.params?.id;
    if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const reason: string | null = body?.reason ?? null;

    const result = await db.query(
      `UPDATE express_vet_requests
       SET status = 'cancelled', cancelled_at = now(), cancel_reason = $1
       WHERE request_id = $2 AND client_user_id = $3 AND status IN ('pending_dispatch', 'claimed')
       RETURNING *`,
      [reason, id, userId]
    );

    if (result.rowCount === 0) {
      const existing = await db.query(`SELECT client_user_id, status FROM express_vet_requests WHERE request_id = $1`, [id]);
      const row = existing.rows[0];
      if (!row) return NextResponse.json({ error: "Request not found" }, { status: 404 });
      if (Number(row.client_user_id) !== Number(userId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json(
        { error: `Cannot cancel a request that is already ${row.status}` },
        { status: 409 }
      );
    }

    return NextResponse.json({ request: result.rows[0] });
  } catch (error) {
    console.error("express-vet requests/[id]/cancel POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
