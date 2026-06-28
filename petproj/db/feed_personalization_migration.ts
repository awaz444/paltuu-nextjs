import pg from 'pg';
const { Pool } = pg;
import * as dotenv from 'dotenv';
import path from 'path';

// Pass 2 migration: personalized feed A/B machinery.
// Run AFTER db/social_feed_migration.ts. Idempotent (IF NOT EXISTS everywhere).
//
//   npx tsx db/feed_personalization_migration.ts
//
// Adds:
//   - feed_impression_logs           (one row per post served on the For You feed)
//   - users.feed_experiment_assigned (distinguishes an explicit A/B assignment from
//                                     the deterministic even/odd default)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// IMPORTANT: live DB is AWS RDS behind NEW_DATABASE_URL (see db/index.ts).
const connectionString = process.env.NEW_DATABASE_URL;
if (!connectionString) {
  throw new Error('NEW_DATABASE_URL environment variable is not set.');
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting Feed Personalization (Pass 2) migration...');
    await client.query('BEGIN');

    // ── A/B impression log (plan §1) ────────────────────────────────────────────
    // One row per post served on ?mode=personalized, per user, with the score
    // breakdown so control vs treatment engagement can be compared later.
    console.log('Creating feed_impression_logs...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS feed_impression_logs (
        id                BIGSERIAL PRIMARY KEY,
        user_id           INT    NOT NULL,
        post_id           BIGINT NOT NULL,
        experiment_bucket VARCHAR(20) NOT NULL,  -- control | treatment
        score_base        FLOAT  NOT NULL DEFAULT 0,
        score_affinity    FLOAT  NOT NULL DEFAULT 0,
        score_final       FLOAT  NOT NULL DEFAULT 0,
        position          INT    NOT NULL DEFAULT 0,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ── Explicit-assignment flag on users ───────────────────────────────────────
    // false  → bucket is the deterministic even/odd default (feed resolves it live)
    // true   → an admin (or signup) explicitly set feed_experiment_bucket; honor it
    console.log('Extending users (feed_experiment_assigned)...');
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS feed_experiment_assigned BOOLEAN DEFAULT false;
    `);

    // ── Indexes for the metrics/dashboard queries ───────────────────────────────
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_feed_impressions_bucket_time ON feed_impression_logs(experiment_bucket, created_at);
      CREATE INDEX IF NOT EXISTS idx_feed_impressions_user_time   ON feed_impression_logs(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_feed_impressions_post        ON feed_impression_logs(post_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Feed Personalization (Pass 2) migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((err) => {
  console.error(err);
  process.exit(1);
});
