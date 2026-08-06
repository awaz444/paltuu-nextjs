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

/**
 * Gives social_comments the same moderation columns social_posts already has
 * (see db/social_feed_migration.ts), so comments can be shadow-hidden the
 * same way posts are — visible to the author, invisible to everyone else,
 * flag never leaves the server. Existing rows default to 'none' / false, i.e.
 * fully visible, matching current behavior exactly.
 */
async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting Comment Moderation migration...');
    await client.query('BEGIN');

    console.log('Adding moderation columns to social_comments...');
    await client.query(`
      ALTER TABLE social_comments ADD COLUMN IF NOT EXISTS is_shadow_hidden BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE social_comments ADD COLUMN IF NOT EXISTS moderation_state VARCHAR(20) NOT NULL DEFAULT 'none';
    `);

    console.log('Adding moderation_state check constraint...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'social_comments_moderation_state_check'
        ) THEN
          ALTER TABLE social_comments
            ADD CONSTRAINT social_comments_moderation_state_check
            CHECK (moderation_state IN ('none', 'shadow_hidden'));
        END IF;
      END $$;
    `);

    console.log('Creating index for admin moderation queue...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_social_comments_moderation_state
        ON social_comments (moderation_state) WHERE moderation_state <> 'none';
    `);

    await client.query('COMMIT');
    console.log('✅ Comment Moderation migration completed successfully!');
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
