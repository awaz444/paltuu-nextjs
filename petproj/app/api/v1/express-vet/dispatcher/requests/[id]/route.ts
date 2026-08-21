import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkDispatcher } from "@/lib/expressVet/dispatcherAuth";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/dispatcher/requests/{id}:
 *   get:
 *     summary: Full case detail for a Vets at Home (Express Vet) request — dispatcher-only (V1)
 *     tags: [v1 Express Vet]
 */
export async function GET(req: NextRequest, context: any) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = context?.params?.id;
  if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

  try {
    const result = await db.query(
      `SELECT r.*, u.name AS client_name, u.profile_image_url AS client_photo_url,
              p.name AS provider_name, p.photo_url AS provider_photo_url
       FROM express_vet_requests r
       JOIN users u ON u.user_id = r.client_user_id
       LEFT JOIN express_vet_providers p ON p.provider_id = r.assigned_provider_id
       WHERE r.request_id = $1`,
      [id]
    );

    const request = result.rows[0];
    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    return NextResponse.json({ request });
  } catch (error) {
    console.error("express-vet dispatcher requests/[id] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
