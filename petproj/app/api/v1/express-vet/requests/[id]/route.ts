import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/requests/{id}:
 *   get:
 *     summary: A single Vets at Home (Express Vet) request, owner-only (V1)
 *     tags: [v1 Express Vet]
 */
export async function GET(req: NextRequest, context: any) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = context?.params?.id;
    if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

    // provider_phone_number: deliberately exposed to the client here (unlike the dispatcher
    // provider-management endpoints' internal-reference-only framing) — once a request is
    // actually assigned, the client needs a way to reach the person coming to their home
    // (the "Contact" button on the request detail screen). Only ever selected alongside a
    // real assigned_provider_id, i.e. only after the dispatcher has vetted the pairing.
    const result = await db.query(
      `SELECT r.*,
              p.name AS provider_name, p.photo_url AS provider_photo_url,
              p.rating AS provider_rating, p.years_experience AS provider_years_experience,
              p.qualifications AS provider_qualifications, p.phone_number AS provider_phone_number,
              rv.rating AS review_rating, rv.review_content AS review_content
       FROM express_vet_requests r
       LEFT JOIN express_vet_providers p ON p.provider_id = r.assigned_provider_id
       LEFT JOIN express_vet_reviews rv ON rv.request_id = r.request_id
       WHERE r.request_id = $1`,
      [id]
    );

    const request = result.rows[0];
    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (Number(request.client_user_id) !== Number(userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ request });
  } catch (error) {
    console.error("express-vet requests/[id] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
