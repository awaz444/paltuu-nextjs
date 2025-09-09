import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/ecom";

export const revalidate = 0;

// This endpoint attempts to locate a reviews table in the ecom DB and query reviews
// for a given product_id. If no reviews table exists it returns an empty array.
export async function GET(req: NextRequest) {
  const client = createClient();
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("product_id");
    if (!productId) {
      return NextResponse.json({ error: "Missing product_id" }, { status: 400 });
    }

    await client.connect();

    // Find any table name that likely contains product reviews. Prefer tables
    // that contain both "review" and "product" in the name. Fall back to
    // any table containing "review".
    const tblRes = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name ILIKE '%product%review%' OR table_name ILIKE '%review%') ORDER BY (table_name ILIKE '%product%review%') DESC, table_name LIMIT 1;`
    );

    if (!tblRes || tblRes.rowCount === 0) {
      // No reviews table found; return empty list
      return NextResponse.json([], { status: 200 });
    }

    const tableName = tblRes.rows[0].table_name;

    // Query a reasonable set of columns. We'll attempt to select common column
    // names and map them into a stable JSON shape for the frontend.
    const q = `SELECT * FROM ${tableName} WHERE product_id = $1 ORDER BY created_at DESC NULLS LAST LIMIT 200`;
    const rows = await client.query(q, [productId]);

    // Map rows into unified shape
    const mapped = rows.rows.map((r: any) => {
      return {
        id: r.id ?? r.review_id ?? r.reviewId ?? null,
        user: r.user_name ?? r.username ?? (r.user_id ? `User ${r.user_id}` : "Guest"),
        rating: r.rating ?? r.stars ?? 0,
        comment: r.comment ?? r.review_content ?? r.content ?? "",
        created_at: r.created_at ?? r.review_date ?? new Date().toISOString(),
      };
    });

    return NextResponse.json(mapped, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching reviews:", err?.message || err);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  } finally {
    try {
      await client.end();
    } catch {}
  }
}
