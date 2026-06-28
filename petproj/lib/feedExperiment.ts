import { db } from "@/db/index";

// Feed A/B experiment helpers (plan §8/§11 + the A/B note).
//
// The "For You" feed (?mode=personalized) is the experiment surface:
//   - control   → ranking = base_score only (today's algorithm)
//   - treatment → ranking = 0.70·base_score + 0.30·affinity
//
// Assignment is deterministic by user_id (even → treatment, odd → control) so the
// whole existing user base is split instantly and nobody flips arms by accident.
// An admin can override any user; users.feed_experiment_assigned = true means the
// stored feed_experiment_bucket is an explicit choice and must be honored over the
// even/odd default.

export type ExperimentBucket = 'control' | 'treatment';

// Ranking weights per arm. Control is pure base (affinity isolated for the test).
export const RANKING_WEIGHTS: Record<ExperimentBucket, { base: number; affinity: number }> = {
  control:   { base: 1.0,  affinity: 0.0 },
  treatment: { base: 0.70, affinity: 0.30 },
};

/** The default arm for a user when nothing has been explicitly assigned. */
export function deterministicBucket(userId: number): ExperimentBucket {
  return userId % 2 === 0 ? 'treatment' : 'control';
}

/** Effective arm: an explicit assignment wins, otherwise the even/odd default. */
export function resolveBucket(
  userId: number,
  assigned: boolean,
  stored: string | null
): ExperimentBucket {
  if (assigned && (stored === 'control' || stored === 'treatment')) return stored;
  return deterministicBucket(userId);
}

/**
 * SQL fragment computing a user's effective bucket, so dashboard/list queries agree
 * with resolveBucket() above. `alias` is the users-table alias in the query.
 */
export function effectiveBucketSql(alias = 'u'): string {
  return `CASE
            WHEN ${alias}.feed_experiment_assigned = true
                 AND ${alias}.feed_experiment_bucket IN ('control', 'treatment')
              THEN ${alias}.feed_experiment_bucket
            ELSE (CASE WHEN ${alias}.user_id % 2 = 0 THEN 'treatment' ELSE 'control' END)
          END`;
}

/**
 * Persist the deterministic bucket the first time a user is served the personalized
 * feed, so it becomes visible/overridable in the admin tools. Never overwrites an
 * explicit assignment. Fire-and-forget — routing for the current request already
 * used the resolved value.
 */
export async function ensureBucketAssigned(userId: number): Promise<void> {
  await db.query(
    `UPDATE users
       SET feed_experiment_bucket = $2,
           feed_experiment_assigned = true
     WHERE user_id = $1
       AND COALESCE(feed_experiment_assigned, false) = false`,
    [userId, deterministicBucket(userId)]
  );
}

export interface ImpressionRow {
  post_id: string | number | bigint;
  score_base: number;
  score_affinity: number;
  score_final: number;
  position: number;
}

/**
 * Batch-insert one impression row per served post. Fire-and-forget:
 *   logFeedImpressions(userId, bucket, rows).catch(() => {});
 */
export async function logFeedImpressions(
  userId: number,
  bucket: ExperimentBucket,
  rows: ImpressionRow[]
): Promise<void> {
  if (rows.length === 0) return;

  // Build a single multi-row INSERT: ($1,$2,$3,$4,$5,$6,$7) per row.
  const values: any[] = [];
  const tuples = rows.map((r, i) => {
    const o = i * 7;
    values.push(
      userId,
      r.post_id,
      bucket,
      r.score_base,
      r.score_affinity,
      r.score_final,
      r.position
    );
    return `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, $${o + 5}, $${o + 6}, $${o + 7})`;
  });

  await db.query(
    `INSERT INTO feed_impression_logs
       (user_id, post_id, experiment_bucket, score_base, score_affinity, score_final, position)
     VALUES ${tuples.join(', ')}`,
    values
  );
}
