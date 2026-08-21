import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkDispatcher } from "@/lib/expressVet/dispatcherAuth";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/dispatcher/inbox:
 *   get:
 *     summary: pending_dispatch Vets at Home (Express Vet) requests, REST fallback/initial load (V1)
 *     tags: [v1 Express Vet]
 */
export async function GET(req: NextRequest) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const result = await db.query(
      `SELECT r.*, u.name AS client_name, u.profile_image_url AS client_photo_url
       FROM express_vet_requests r
       JOIN users u ON u.user_id = r.client_user_id
       WHERE r.status = 'pending_dispatch'
       ORDER BY r.created_at ASC`
    );

    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error("express-vet dispatcher/inbox GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
