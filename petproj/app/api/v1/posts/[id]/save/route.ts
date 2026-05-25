import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/posts/:id/save
 * Save a post to All Posts and optionally other collections
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userIdRaw = await getUserIdFromRequest(req);
    if (!userIdRaw) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
    const userId = parseInt(String(userIdRaw), 10);
    const postId = params.id;

    const body = await req.json().catch(() => ({}));
    const collectionIds: number[] = body.collection_ids || [];

    // 1. Check if post exists and is not deleted
    const postCheck = await db.query("SELECT post_id FROM social_posts WHERE post_id = $1 AND is_deleted = false", [postId]);
    if (postCheck.rowCount === 0) {
      return NextResponse.json({ error: { code: "POST_NOT_FOUND", message: "Post does not exist", status: 404 } }, { status: 404 });
    }

    await db.query('BEGIN');
    try {
      // 2. Check if already saved
      let saveId: string | number;
      const existingSave = await db.query("SELECT save_id FROM saved_posts WHERE user_id = $1 AND post_id = $2", [userId, postId]);

      if (existingSave.rowCount === 0) {
        // 3. Create saved_posts entry
        const newSave = await db.query(
          "INSERT INTO saved_posts (user_id, post_id) VALUES ($1, $2) RETURNING save_id",
          [userId, postId]
        );
        saveId = newSave.rows[0].save_id;

        // 4. Auto-add to "All Posts" collection
        let defaultCollection = await db.query(
          "SELECT collection_id FROM save_collections WHERE user_id = $1 AND is_default = true",
          [userId]
        );

        if (defaultCollection.rowCount === 0) {
          const createCol = await db.query(
            "INSERT INTO save_collections (user_id, name, is_default) VALUES ($1, 'All Posts', true) RETURNING collection_id",
            [userId]
          );
          defaultCollection = createCol;
        }

        const allPostsId = defaultCollection.rows[0].collection_id;
        await db.query(
          "INSERT INTO collection_posts (collection_id, save_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [allPostsId, saveId]
        );
        await db.query("UPDATE save_collections SET post_count = post_count + 1 WHERE collection_id = $1", [allPostsId]);
      } else {
        saveId = existingSave.rows[0].save_id;
      }

      // 5. Add to additional collections if provided
      for (const cId of collectionIds) {
        // Verify collection belongs to user
        const colCheck = await db.query("SELECT collection_id FROM save_collections WHERE collection_id = $1 AND user_id = $2", [cId, userId]);
        if ((colCheck.rowCount ?? 0) > 0) {
          const res = await db.query(
            "INSERT INTO collection_posts (collection_id, save_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [cId, saveId]
          );
          if ((res.rowCount ?? 0) > 0) {
            await db.query("UPDATE save_collections SET post_count = post_count + 1 WHERE collection_id = $1", [cId]);
          }
        }
      }

      await db.query('COMMIT');
      return NextResponse.json({ saved: true, save_id: saveId });
    } catch (e) {
      await db.query('ROLLBACK');
      throw e;
    }
  } catch (error) {
    console.error("Save Post POST error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error", status: 500 } }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/posts/:id/save
 * Completely unsave a post from all collections
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userIdRaw = await getUserIdFromRequest(req);
    if (!userIdRaw) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
    const userId = parseInt(String(userIdRaw), 10);
    const postId = params.id;

    await db.query('BEGIN');
    try {
      const existingSave = await db.query("SELECT save_id FROM saved_posts WHERE user_id = $1 AND post_id = $2", [userId, postId]);

      if ((existingSave.rowCount ?? 0) > 0) {
        const saveId = existingSave.rows[0].save_id;

        // 1. Decrement post_count for all affected collections
        await db.query(`
          UPDATE save_collections sc
          SET post_count = GREATEST(0, sc.post_count - 1)
          FROM collection_posts cp
          WHERE cp.collection_id = sc.collection_id
            AND cp.save_id = $1
        `, [saveId]);

        // 2. Delete from collection_posts (handled by cascade if we want, but explicit is better for post_count)
        await db.query("DELETE FROM collection_posts WHERE save_id = $1", [saveId]);

        // 3. Delete from saved_posts
        await db.query("DELETE FROM saved_posts WHERE save_id = $1", [saveId]);
      }

      await db.query('COMMIT');
      return NextResponse.json({ unsaved: true });
    } catch (e) {
      await db.query('ROLLBACK');
      throw e;
    }
  } catch (error) {
    console.error("Save Post DELETE error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error", status: 500 } }, { status: 500 });
  }
}
