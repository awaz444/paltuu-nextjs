import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkDispatcher } from "@/lib/expressVet/dispatcherAuth";
import { EXPRESS_VET_CATEGORY_SPECIES } from "@/lib/expressVet/catalog";
import { rateLimit, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = Object.keys(EXPRESS_VET_CATEGORY_SPECIES);
const EDITABLE_FIELDS = ["name", "photo_url", "years_experience", "qualifications", "categories", "phone_number", "is_active"];

/**
 * @swagger
 * /api/v1/express-vet/dispatcher/providers/{id}:
 *   get:
 *     summary: A single Vets at Home (Express Vet) provider, incl. rating history (V1)
 *     tags: [v1 Express Vet]
 *   patch:
 *     summary: Edit a Vets at Home (Express Vet) provider, incl. toggling is_active (V1)
 *     tags: [v1 Express Vet]
 */
export async function GET(req: NextRequest, context: any) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = context?.params?.id;
  if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

  try {
    const providerRes = await db.query(`SELECT * FROM express_vet_providers WHERE provider_id = $1`, [id]);
    const provider = providerRes.rows[0];
    if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

    const reviewsRes = await db.query(
      `SELECT rv.rating, rv.review_content, rv.created_at, rv.addon_reason_tags, rv.addon_total_pkr, u.name AS client_name
       FROM express_vet_reviews rv
       JOIN users u ON u.user_id = rv.client_user_id
       WHERE rv.provider_id = $1
       ORDER BY rv.created_at DESC
       LIMIT 20`,
      [id]
    );

    return NextResponse.json({ provider, reviews: reviewsRes.rows });
  } catch (error) {
    console.error("express-vet dispatcher/providers/[id] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: any) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limited = await rateLimit(req, LIMITS.EXPRESS_VET_PROVIDER_UPDATE);
  if (limited) return limited;

  const id = context?.params?.id;
  if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

  try {
    const body = await req.json();

    if (body.categories !== undefined) {
      const categories = Array.isArray(body.categories) ? body.categories : [];
      if (categories.length === 0 || !categories.every((c: string) => VALID_CATEGORIES.includes(c))) {
        return NextResponse.json(
          { error: `categories must be a non-empty array of: ${VALID_CATEGORIES.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const updates: string[] = [];
    const params: any[] = [];
    for (const field of EDITABLE_FIELDS) {
      if (body[field] !== undefined) {
        params.push(body[field]);
        updates.push(`${field} = $${params.length}`);
      }
    }
    if (updates.length === 0) {
      return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    }
    params.push(id);

    const result = await db.query(
      `UPDATE express_vet_providers SET ${updates.join(", ")}, updated_at = now()
       WHERE provider_id = $${params.length}
       RETURNING *`,
      params
    );

    if (result.rowCount === 0) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

    return NextResponse.json({ provider: result.rows[0] });
  } catch (error) {
    console.error("express-vet dispatcher/providers/[id] PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
