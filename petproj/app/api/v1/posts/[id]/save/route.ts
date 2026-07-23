import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { recordEngagementEvent } from "@/lib/interestScoring";
import { resolveRepostTarget } from "@/lib/reposts";
import { invalidateViewerPostCache } from "@/lib/redis";

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

    const body = await req.json().catch(() => ({}));
    const collectionIds: number[] = body.collection_ids || [];

    // Saving a plain repost card must save the underlying root post — a plain
    // repost entry is a hollow row with no content of its own to bookmark.
    const resolved = await resolveRepostTarget(db, params.id);
    if (!resolved || resolved.isDeleted) {
      return NextResponse.json({ error: { code: "POST_NOT_FOUND", message: "Post does not exist", status: 404 } }, { status: 404 });
    }
    const postId = resolved.postId;

    let wasNewSave = false;
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      // 2. Check if already saved
      let saveId: string | number;
      const existingSave = await client.query("SELECT save_id FROM saved_posts WHERE user_id = $1 AND post_id = $2", [userId, postId]);

      if (existingSave.rowCount === 0) {
        wasNewSave = true;
        // 3. Create saved_posts entry
        const newSave = await client.query(
          "INSERT INTO saved_posts (user_id, post_id) VALUES ($1, $2) RETURNING save_id",
          [userId, postId]
        );
        saveId = newSave.rows[0].save_id;

        // 4. Auto-add to "All Posts" collection
        let defaultCollection = await client.query(
          "SELECT collection_id FROM save_collections WHERE user_id = $1 AND is_default = true",
          [userId]
        );

        if (defaultCollection.rowCount === 0) {
          const createCol = await client.query(
            "INSERT INTO save_collections (user_id, name, is_default) VALUES ($1, 'All Posts', true) RETURNING collection_id",
            [userId]
          );
          defaultCollection = createCol;
        }

        const allPostsId = defaultCollection.rows[0].collection_id;
        await client.query(
          "INSERT INTO collection_posts (collection_id, save_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [allPostsId, saveId]
        );
        await client.query("UPDATE save_collections SET post_count = post_count + 1 WHERE collection_id = $1", [allPostsId]);
      } else {
        saveId = existingSave.rows[0].save_id;
      }

      // 5. Add to additional collections if provided
      for (const cId of collectionIds) {
        // Verify collection belongs to user
        const colCheck = await client.query("SELECT collection_id FROM save_collections WHERE collection_id = $1 AND user_id = $2", [cId, userId]);
        if ((colCheck.rowCount ?? 0) > 0) {
          const res = await client.query(
            "INSERT INTO collection_posts (collection_id, save_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [cId, saveId]
          );
          if ((res.rowCount ?? 0) > 0) {
            await client.query("UPDATE save_collections SET post_count = post_count + 1 WHERE collection_id = $1", [cId]);
          }
        }
      }

      await client.query('COMMIT');
      // Fire-and-forget interest scoring (only on a brand-new save, not re-saves)
      if (wasNewSave) recordEngagementEvent(userId, postId, 'save').catch(() => {});
      invalidateViewerPostCache(postId, userId).catch(() => {});
      return NextResponse.json({ saved: true, save_id: saveId });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
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
    const resolved = await resolveRepostTarget(db, params.id);
    const postId = resolved ? resolved.postId : params.id;

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const existingSave = await client.query("SELECT save_id FROM saved_posts WHERE user_id = $1 AND post_id = $2", [userId, postId]);

      if ((existingSave.rowCount ?? 0) > 0) {
        const saveId = existingSave.rows[0].save_id;

        // 1. Decrement post_count for all affected collections
        await client.query(`
          UPDATE save_collections sc
          SET post_count = GREATEST(0, sc.post_count - 1)
          FROM collection_posts cp
          WHERE cp.collection_id = sc.collection_id
            AND cp.save_id = $1
        `, [saveId]);

        // 2. Delete from collection_posts (handled by cascade if we want, but explicit is better for post_count)
        await client.query("DELETE FROM collection_posts WHERE save_id = $1", [saveId]);

        // 3. Delete from saved_posts
        await client.query("DELETE FROM saved_posts WHERE save_id = $1", [saveId]);
      }

      await client.query('COMMIT');
      invalidateViewerPostCache(postId, userId).catch(() => {});
      return NextResponse.json({ unsaved: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Save Post DELETE error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error", status: 500 } }, { status: 500 });
  }
}
