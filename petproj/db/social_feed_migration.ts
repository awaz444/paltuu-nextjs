import pg from 'pg';
const { Pool } = pg;
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// IMPORTANT: the live database is on AWS RDS behind NEW_DATABASE_URL (see db/index.ts).
// The older report_block_migration.ts used DATABASE_URL (the legacy Supabase DB) — do
// NOT copy that here.
const connectionString = process.env.NEW_DATABASE_URL;
if (!connectionString) {
  throw new Error('NEW_DATABASE_URL environment variable is not set.');
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

// Full default settings blob for the feed/moderation system (plan §9). Stored as a
// single JSONB row in app_settings under the key below so it can be read in one query.
const DEFAULT_SOCIAL_FEED_SETTINGS = {
  auto_quarantine_weighted_threshold: 10,
  severity_fast_lane_threshold: 4.0,
  severity_fast_lane_reasons: ['ANIMAL_ABUSE', 'HATE_SPEECH'],
  report_burst_count: 5,
  report_burst_window_minutes: 30,
  min_account_age_days: 7,
  min_trusted_reports_for_auto: 3,
  quarantine_grace_hours: 1,
  report_immunity_hours: 48,
  preemptive_block_window_hours: 48,
  feed_weight_base: 0.7,
  feed_weight_affinity: 0.3,
  cold_start_interaction_threshold: 10,
};

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting Social Feed migration...');
    await client.query('BEGIN');

    // ── New tables ────────────────────────────────────────────────────────────
    console.log('Creating content_tags...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_tags (
        tag_id          SERIAL PRIMARY KEY,
        slug            VARCHAR(100) UNIQUE NOT NULL,
        label           VARCHAR(100) NOT NULL,
        category        VARCHAR(30)  NOT NULL,  -- species | topic | content_type | mood
        parent_tag_id   INT,
        default_weight  FLOAT   NOT NULL DEFAULT 1.0,
        keyword_aliases TEXT[]  NOT NULL DEFAULT '{}',
        is_active       BOOLEAN NOT NULL DEFAULT true,
        sort_order      INT     NOT NULL DEFAULT 0
      );
    `);

    console.log('Creating post_content_tags...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_content_tags (
        post_id   BIGINT NOT NULL,
        tag_id    INT    NOT NULL,
        role      VARCHAR(20) NOT NULL DEFAULT 'secondary',  -- primary | secondary
        tagged_by INT,
        tagged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        source    VARCHAR(20) NOT NULL DEFAULT 'admin',      -- admin | auto (future)
        PRIMARY KEY (post_id, tag_id)
      );
    `);

    // Additive interest score per user per tag. Capped at 10.0 (see score_cap below).
    console.log('Creating user_interest_scores...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_interest_scores (
        user_id    INT   NOT NULL,
        tag_id     INT   NOT NULL,
        score      FLOAT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, tag_id)
      );
    `);

    console.log('Creating user_interest_picks...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_interest_picks (
        user_id    INT NOT NULL,
        tag_id     INT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, tag_id)
      );
    `);

    console.log('Creating user_interest_events...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_interest_events (
        event_id         BIGSERIAL PRIMARY KEY,
        user_id          INT   NOT NULL,
        tag_id           INT   NOT NULL,
        post_id          BIGINT,
        delta            FLOAT NOT NULL,
        event_type       VARCHAR(30) NOT NULL,  -- like|save|comment|repost|backfill|onboarding|undo|not_interested
        reversible_until TIMESTAMPTZ,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Creating pending_interest_events...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS pending_interest_events (
        id         BIGSERIAL PRIMARY KEY,
        user_id    INT    NOT NULL,
        post_id    BIGINT NOT NULL,
        event_type VARCHAR(20) NOT NULL,  -- like | save | comment | repost
        delta      FLOAT  NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Creating app_settings_versions...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings_versions (
        version_id     SERIAL PRIMARY KEY,
        settings_key   VARCHAR(100) NOT NULL,
        settings_value JSONB NOT NULL,
        created_by     INT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ── Extend social_posts ─────────────────────────────────────────────────────
    console.log('Extending social_posts...');
    await client.query(`
      ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS tagging_status  VARCHAR(20) DEFAULT 'untagged';
      ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS primary_tag_id  INT;
      ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS tagged_at       TIMESTAMPTZ;
      ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS tagged_by       INT;
      ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS moderation_state          VARCHAR(20) DEFAULT 'none';
      ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS report_weighted_score     FLOAT DEFAULT 0;
      ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS report_immunity_until     TIMESTAMPTZ;
      ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS suspicious_burst_at       TIMESTAMPTZ;
      ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS author_block_after_report BOOLEAN DEFAULT false;
    `);

    // ── Extend users ────────────────────────────────────────────────────────────
    console.log('Extending users...');
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reporter_trust       FLOAT DEFAULT 1.0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS lifetime_dismissals  INT   DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_ceiling        FLOAT DEFAULT 1.0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_dismissal_at    TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS feed_experiment_bucket    VARCHAR(20) DEFAULT 'control';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS feed_personalization_tier VARCHAR(20) DEFAULT 'cold_start';
    `);

    // ── Extend reports ──────────────────────────────────────────────────────────
    console.log('Extending reports...');
    await client.query(`
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_weight FLOAT;
    `);

    // ── Interest score cap (0..10). Postgres has no ADD CONSTRAINT IF NOT EXISTS. ──
    console.log('Adding score_cap constraint...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'score_cap'
        ) THEN
          ALTER TABLE user_interest_scores
            ADD CONSTRAINT score_cap CHECK (score >= 0 AND score <= 10);
        END IF;
      END $$;
    `);

    // ── Indexes ─────────────────────────────────────────────────────────────────
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_pending_interest_post ON pending_interest_events(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_content_tags_post ON post_content_tags(post_id);
      CREATE INDEX IF NOT EXISTS idx_user_interest_scores_user ON user_interest_scores(user_id);
      CREATE INDEX IF NOT EXISTS idx_social_posts_tagging ON social_posts(tagging_status, created_at);
      CREATE INDEX IF NOT EXISTS idx_user_interest_events_user ON user_interest_events(user_id);
    `);

    // ── Drop the legacy auto-hide trigger; lib/reportScoring.ts owns this now ─────
    console.log('Dropping legacy trg_reports_insert trigger...');
    await client.query(`DROP TRIGGER IF EXISTS trg_reports_insert ON reports;`);
    await client.query(`DROP FUNCTION IF EXISTS update_post_report_count();`);

    // ── Seed default settings blob ──────────────────────────────────────────────
    console.log('Seeding social_feed_settings...');
    await client.query(
      `INSERT INTO app_settings (setting_key, setting_value, description)
       VALUES ('social_feed_settings', $1::jsonb, 'Feed weights + moderation thresholds (plan §9)')
       ON CONFLICT (setting_key) DO NOTHING;`,
      [JSON.stringify(DEFAULT_SOCIAL_FEED_SETTINGS)]
    );

    await client.query('COMMIT');
    console.log('✅ Social Feed migration completed successfully!');
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
