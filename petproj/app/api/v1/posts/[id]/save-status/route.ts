import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/posts/:id/save-status
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userIdRaw = await getUserIdFromRequest(req);
    if (!userIdRaw) return NextResponse.json({ is_saved: false, collections: [] });
    const userId = parseInt(String(userIdRaw), 10);
    const postId = params.id;

    const saveRes = await db.query(`
      SELECT sp.save_id,
             json_agg(json_build_object('collection_id', sc.collection_id, 'name', sc.name)) as collections
      FROM saved_posts sp
      LEFT JOIN collection_posts cp ON cp.save_id = sp.save_id
      LEFT JOIN save_collections sc ON sc.collection_id = cp.collection_id
      WHERE sp.user_id = $1 AND sp.post_id = $2
      GROUP BY sp.save_id
    `, [userId, postId]);

    if (saveRes.rowCount === 0) {
      return NextResponse.json({ is_saved: false, collections: [] });
    }

    const data = saveRes.rows[0];
    return NextResponse.json({
      is_saved: true,
      save_id: data.save_id,
      collections: data.collections[0]?.collection_id === null ? [] : data.collections
    });

  } catch (error) {
    console.error("Save Status GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
