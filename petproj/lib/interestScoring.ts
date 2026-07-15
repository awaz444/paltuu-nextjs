import { db } from "@/db/index";

// Interest scoring (plan §4). Additive per-tag affinity, capped at 10.0 in SQL.
//
// Usage: fire-and-forget from the engagement handlers AFTER their COMMIT, e.g.
//   recordEngagementEvent(userId, postId, 'like').catch(() => {});
//
// post_id is BIGINT in Postgres — accept string | number and pass it straight
// through as a parameter (node-pg handles the cast).

export const MAX_INTEREST_SCORE = 10.0;

export type EngagementType = 'like' | 'save' | 'comment' | 'repost';

export const EVENT_DELTAS: Record<EngagementType, number> = {
  like: 0.15,
  save: 0.25,
  comment: 0.20,
  repost: 0.30,
};

type PostId = string | number | bigint;

/**
 * Record an engagement against a post's primary tags.
 * - If the post is not yet tagged, the event is queued in pending_interest_events
 *   and later replayed (dampened) by backfillInterestForPost on admin tag.
 * - If tagged, each primary tag's score is bumped and an audit row is written.
 */
export async function recordEngagementEvent(
  userId: number,
  postId: PostId,
  eventType: EngagementType
): Promise<void> {
  const delta = EVENT_DELTAS[eventType];
  if (delta == null) return;

  const post = await db.query(
    `SELECT tagging_status FROM social_posts WHERE post_id = $1`,
    [postId]
  );
  const status = post.rows[0]?.tagging_status;

  // Untagged (or missing): queue for backfill on admin tag.
  if (status !== 'tagged') {
    await db.query(
      `INSERT INTO pending_interest_events (user_id, post_id, event_type, delta)
       VALUES ($1, $2, $3, $4)`,
      [userId, postId, eventType, delta]
    );
    return;
  }

  const primaryTags = await db.query(
    `SELECT tag_id FROM post_content_tags WHERE post_id = $1 AND role = 'primary'`,
    [postId]
  );

  for (const { tag_id } of primaryTags.rows) {
    await upsertInterestScore(userId, tag_id, delta);
    await db.query(
      `INSERT INTO user_interest_events (user_id, tag_id, post_id, delta, event_type)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, tag_id, postId, delta, eventType]
    );
  }
}

/**
 * Replay events queued while a post was untagged (plan §4).
 * Processes events within the last 72h at 50% strength, capped at 1.5 total per
 * user per post. Always clears the pending queue for the post afterwards.
 */
export async function backfillInterestForPost(
  postId: PostId,
  primaryTagIds: number[]
): Promise<void> {
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);

  const pending = await db.query(
    `SELECT user_id, delta FROM pending_interest_events
     WHERE post_id = $1 AND created_at >= $2
     ORDER BY created_at ASC`,
    [postId, cutoff]
  );

  if (primaryTagIds.length > 0) {
    const userCaps: Record<number, number> = {};
    for (const event of pending.rows) {
      const userId = event.user_id as number;
      const remaining = 1.5 - (userCaps[userId] ?? 0);
      if (remaining <= 0) continue;

      const dampened = Math.min(Number(event.delta) * 0.5, remaining);
      userCaps[userId] = (userCaps[userId] ?? 0) + dampened;

      for (const tagId of primaryTagIds) {
        await upsertInterestScore(userId, tagId, dampened);
        await db.query(
          `INSERT INTO user_interest_events (user_id, tag_id, post_id, delta, event_type)
           VALUES ($1, $2, $3, $4, 'backfill')`,
          [userId, tagId, postId, dampened]
        );
      }
    }
  }

  // Always drain the queue for this post (even if it was tagged with no primaries).
  await db.query(`DELETE FROM pending_interest_events WHERE post_id = $1`, [postId]);
}

/**
 * Additive upsert with a hard 0..10 cap (matches the score_cap CHECK constraint).
 */
export async function upsertInterestScore(
  userId: number,
  tagId: number,
  delta: number
): Promise<void> {
  await db.query(
    `INSERT INTO user_interest_scores (user_id, tag_id, score, updated_at)
     VALUES ($1, $2, LEAST($3::double precision, $4::double precision), NOW())
     ON CONFLICT (user_id, tag_id) DO UPDATE
       SET score = LEAST(user_interest_scores.score + $3::double precision, $4::double precision),
           updated_at = NOW()`,
    [userId, tagId, delta, MAX_INTEREST_SCORE]
  );
}
