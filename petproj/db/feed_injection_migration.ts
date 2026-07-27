import pg from 'pg';
const { Pool } = pg;
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// IMPORTANT: the live database is on AWS RDS behind NEW_DATABASE_URL (see db/index.ts).
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
    console.log('Starting Feed Injection migration...');
    await client.query('BEGIN');

    // Tracks which adoption/lost-found cards have already been injected into a
    // given user's feed, so a repeat page load doesn't keep showing the same
    // listing — see lib/feedInjection.ts. `shown_at` is refreshed (not a fresh
    // row) whenever the cooldown has already expired and the item is chosen again.
    console.log('Creating feed_injected_impressions...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS feed_injected_impressions (
        id         BIGSERIAL PRIMARY KEY,
        user_id    INT NOT NULL,
        item_type  VARCHAR(20) NOT NULL,
        item_id    BIGINT NOT NULL,
        shown_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Adding item_type check constraint...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'feed_injected_impressions_item_type_check'
        ) THEN
          ALTER TABLE feed_injected_impressions
            ADD CONSTRAINT feed_injected_impressions_item_type_check CHECK (item_type IN ('adoption', 'lost_found'));
        END IF;
      END $$;
    `);

    console.log('Adding uniqueness constraint (for upsert-on-reshow)...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'feed_injected_impressions_unique'
        ) THEN
          ALTER TABLE feed_injected_impressions
            ADD CONSTRAINT feed_injected_impressions_unique UNIQUE (user_id, item_type, item_id);
        END IF;
      END $$;
    `);

    console.log('Creating lookup index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_feed_injected_impressions_lookup
        ON feed_injected_impressions (user_id, item_type, shown_at);
    `);

    await client.query('COMMIT');
    console.log('✅ Feed Injection migration completed successfully!');
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
