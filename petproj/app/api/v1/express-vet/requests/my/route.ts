import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

/**
 * @swagger
 * /api/v1/express-vet/requests/my:
 *   get:
 *     summary: The current user's Vets at Home (Express Vet) requests, paginated (V1)
 *     tags: [v1 Express Vet]
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const offset = (page - 1) * PAGE_SIZE;

    // review_rating included so the client can tell a completed-and-reviewed request apart
    // from a completed-but-still-needs-a-review one — the persistent booking bar (see
    // PetsHubScreen's usage of this endpoint) keeps showing the latter until reviewed.
    const result = await db.query(
      `SELECT r.*, p.name AS provider_name, p.photo_url AS provider_photo_url, p.rating AS provider_rating,
              rv.rating AS review_rating
       FROM express_vet_requests r
       LEFT JOIN express_vet_providers p ON p.provider_id = r.assigned_provider_id
       LEFT JOIN express_vet_reviews rv ON rv.request_id = r.request_id
       WHERE r.client_user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, PAGE_SIZE, offset]
    );

    return NextResponse.json({ data: result.rows, page, limit: PAGE_SIZE });
  } catch (error) {
    console.error("express-vet requests/my GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
