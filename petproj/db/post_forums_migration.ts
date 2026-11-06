import pg from 'pg';
const { Pool } = pg;
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Direct forum placement for posts (PALTU-97). Run from petproj/:
//   npx tsx db/post_forums_migration.ts
//
// Additive only. One row per post at most: the forum it was posted in or
// moved to. `species` is a COMMUNITY_SPECIES key ('cat', 'dog', ...);
// `breed_id` is null for a species-level placement. `source` decides
// precedence (lib/forumPlacement.ts): admin > author > auto. An admin row
// overrides pet-tag and species-tag placement; the others add to it.
// Safe to re-run.

const connectionString = process.env.NEW_DATABASE_URL;
if (!connectionString) {
  throw new Error('NEW_DATABASE_URL environment variable is not set.');
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function runMigration() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_forums (
        post_id   BIGINT PRIMARY KEY REFERENCES social_posts(post_id) ON DELETE CASCADE,
        species   VARCHAR(20) NOT NULL,
        breed_id  INTEGER REFERENCES breeds(breed_id) ON DELETE SET NULL,
        source    VARCHAR(10) NOT NULL CHECK (source IN ('author', 'auto', 'admin')),
        set_by    INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
        set_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_post_forums_breed ON post_forums (breed_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_post_forums_species ON post_forums (species)`);
    await client.query('COMMIT');
    console.log('post_forums ready.');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((e) => {
  console.error(e);
  process.exit(1);
});
