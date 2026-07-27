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
    console.log('Starting Follow Requests migration...');
    await client.query('BEGIN');

    // Existing rows are real, already-accepted follows — default them to 'accepted'
    // so nothing already-following gets treated as pending.
    console.log('Adding status to social_follows...');
    await client.query(`
      ALTER TABLE social_follows ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'accepted';
    `);

    console.log('Adding status check constraint...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'social_follows_status_check'
        ) THEN
          ALTER TABLE social_follows
            ADD CONSTRAINT social_follows_status_check CHECK (status IN ('pending', 'accepted'));
        END IF;
      END $$;
    `);

    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_social_follows_following_status
        ON social_follows (following_id, status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_social_follows_follower_status
        ON social_follows (follower_id, status);
    `);

    await client.query('COMMIT');
    console.log('✅ Follow Requests migration completed successfully!');
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
