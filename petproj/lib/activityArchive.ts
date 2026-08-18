import type { PoolClient } from "pg";
import { db } from "@/db/index";

let tablesReady: boolean | null = null;
let inflight: Promise<boolean> | null = null;

export async function ensureActivityArchiveTables(): Promise<boolean> {
    if (tablesReady !== null) return tablesReady;
    if (inflight) return inflight;

    inflight = (async () => {
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS deleted_social_posts (
                  deleted_post_id BIGSERIAL PRIMARY KEY,
                  post_id BIGINT NOT NULL,
                  user_id INT NOT NULL,
                  content TEXT,
                  thumbnail_url TEXT,
                  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);
            await db.query(`
                CREATE TABLE IF NOT EXISTS deleted_social_comments (
                  deleted_comment_id BIGSERIAL PRIMARY KEY,
                  comment_id BIGINT NOT NULL,
                  post_id BIGINT NOT NULL,
                  user_id INT NOT NULL,
                  content TEXT,
                  thumbnail_url TEXT,
                  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);
            await db.query(`
                CREATE INDEX IF NOT EXISTS idx_deleted_social_posts_user_deleted
                  ON deleted_social_posts (user_id, deleted_at DESC)
            `);
            await db.query(`
                CREATE INDEX IF NOT EXISTS idx_deleted_social_comments_user_deleted
                  ON deleted_social_comments (user_id, deleted_at DESC)
            `);
            tablesReady = true;
            return true;
        } catch (err) {
            console.error("ensureActivityArchiveTables:", err);
            tablesReady = null;
            return false;
        } finally {
            inflight = null;
        }
    })();

    return inflight;
}

async function firstPostThumbnail(client: PoolClient, postId: string | number): Promise<string | null> {
    const media = await client.query(
        `SELECT COALESCE(thumbnail_url, url) AS thumb
         FROM social_post_media
         WHERE post_id = $1
         ORDER BY ordering NULLS LAST, media_id
         LIMIT 1`,
        [postId]
    );
    return media.rows[0]?.thumb ?? null;
}

export async function archiveDeletedPost(
    client: PoolClient,
    postId: string | number,
    userId: number
): Promise<void> {
    const ready = await ensureActivityArchiveTables();
    if (!ready) return;
    try {
        const row = await client.query(
            `SELECT content FROM social_posts WHERE post_id = $1`,
            [postId]
        );
        const thumbnail = await firstPostThumbnail(client, postId);
        await client.query(
            `INSERT INTO deleted_social_posts (post_id, user_id, content, thumbnail_url)
             VALUES ($1, $2, $3, $4)`,
            [postId, userId, row.rows[0]?.content ?? null, thumbnail]
        );
    } catch (err) {
        console.error("archiveDeletedPost:", err);
    }
}

export async function archiveDeletedComments(
    client: PoolClient,
    rootCommentId: string | number,
    userId: number
): Promise<void> {
    const ready = await ensureActivityArchiveTables();
    if (!ready) return;
    try {
        const subtree = await client.query(
            `
            WITH RECURSIVE subtree AS (
                SELECT comment_id, post_id, user_id, content, is_deleted
                FROM social_comments
                WHERE comment_id = $1
                UNION ALL
                SELECT c.comment_id, c.post_id, c.user_id, c.content, c.is_deleted
                FROM social_comments c
                JOIN subtree s ON c.parent_comment_id = s.comment_id
            )
            SELECT comment_id, post_id, user_id, content
            FROM subtree
            WHERE is_deleted = false
            `,
            [rootCommentId]
        );

        for (const row of subtree.rows) {
            const thumbnail = await firstPostThumbnail(client, row.post_id);
            await client.query(
                `INSERT INTO deleted_social_comments (comment_id, post_id, user_id, content, thumbnail_url)
                 VALUES ($1, $2, $3, $4, $5)`,
                [row.comment_id, row.post_id, row.user_id, row.content, thumbnail]
            );
        }
    } catch (err) {
        console.error("archiveDeletedComments:", err);
    }
}
