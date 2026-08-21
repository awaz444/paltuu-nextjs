import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { EXPRESS_VET_ADDON_REASON_TAGS } from "@/lib/expressVet/catalog";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/requests/{id}/review:
 *   post:
 *     summary: Submit a rating + optional add-on-charge log for a completed Vets at Home (Express Vet) request (V1)
 *     tags: [v1 Express Vet]
 */
export async function POST(req: NextRequest, context: any) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = context?.params?.id;
  if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

  try {
    const body = await req.json();
    const rating = Number(body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be an integer from 1 to 5" }, { status: 400 });
    }

    const addonReasonTags: string[] = Array.isArray(body?.addon_reason_tags) ? body.addon_reason_tags : [];
    if (!addonReasonTags.every((t) => EXPRESS_VET_ADDON_REASON_TAGS.includes(t))) {
      return NextResponse.json(
        { error: `addon_reason_tags must be from: ${EXPRESS_VET_ADDON_REASON_TAGS.join(", ")}` },
        { status: 400 }
      );
    }
    const addonTotalPkr =
      body?.addon_total_pkr !== undefined && body?.addon_total_pkr !== null ? Number(body.addon_total_pkr) : null;
    if (addonTotalPkr !== null && (!Number.isFinite(addonTotalPkr) || addonTotalPkr < 0)) {
      return NextResponse.json({ error: "addon_total_pkr must be a non-negative number" }, { status: 400 });
    }

    const requestRes = await db.query(`SELECT * FROM express_vet_requests WHERE request_id = $1`, [id]);
    const request = requestRes.rows[0];
    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (Number(request.client_user_id) !== Number(userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (request.status !== "completed") {
      return NextResponse.json({ error: "This request hasn't been completed yet" }, { status: 409 });
    }
    if (!request.assigned_provider_id) {
      return NextResponse.json({ error: "This request has no assigned provider" }, { status: 409 });
    }

    const structuredAnswers = {
      was_on_time: body?.was_on_time ?? null,
      price_as_agreed: body?.price_as_agreed ?? null,
    };

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      let review;
      try {
        const reviewRes = await client.query(
          `INSERT INTO express_vet_reviews (
             request_id, provider_id, client_user_id, rating, structured_answers,
             review_content, addon_reason_tags, addon_total_pkr
           ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
           RETURNING *`,
          [
            id,
            request.assigned_provider_id,
            userId,
            rating,
            JSON.stringify(structuredAnswers),
            body?.review_content ?? null,
            addonReasonTags,
            addonTotalPkr,
          ]
        );
        review = reviewRes.rows[0];
      } catch (insertError: any) {
        if (insertError?.code === "23505") {
          // unique_violation on request_id — one review per completed request.
          await client.query("ROLLBACK");
          return NextResponse.json({ error: "You've already reviewed this visit" }, { status: 409 });
        }
        throw insertError;
      }

      // Recompute the provider's aggregate rating in the same transaction — no DB
      // trigger exists for this anywhere in the schema, so it has to happen here.
      const aggRes = await client.query(
        `SELECT AVG(rating)::numeric(3,2) AS avg_rating, COUNT(*)::int AS total
         FROM express_vet_reviews WHERE provider_id = $1`,
        [request.assigned_provider_id]
      );
      const { avg_rating, total } = aggRes.rows[0];
      await client.query(
        `UPDATE express_vet_providers SET rating = $1, total_reviews = $2, updated_at = now() WHERE provider_id = $3`,
        [avg_rating, total, request.assigned_provider_id]
      );

      await client.query("COMMIT");

      return NextResponse.json({ review }, { status: 201 });
    } catch (txError) {
      await client.query("ROLLBACK");
      throw txError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("express-vet requests/[id]/review POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
