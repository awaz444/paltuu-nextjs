import pg from 'pg';
const { Pool } = pg;
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Indexes for the hot columns read by the feed/profile GET routes
// (app/api/v1/social/posts/route.ts, app/api/v1/social/profile/[id]/route.ts).
// CREATE INDEX CONCURRENTLY cannot run inside a transaction block, so this
// migration intentionally does not wrap statements in BEGIN/COMMIT — each
// statement runs and commits independently, and IF NOT EXISTS makes re-runs
// (e.g. after a partial failure) safe.
const INDEX_STATEMENTS = [
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_posts_user_created
     ON social_posts (user_id, created_at DESC);`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_posts_created
     ON social_posts (created_at DESC) WHERE is_deleted = false;`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_likes_post_user
     ON social_likes (post_id, user_id);`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_reposts_post_user
     ON social_reposts (post_id, user_id);`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_posts_post_user
     ON saved_posts (post_id, user_id);`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_comments_post_user_deleted
     ON social_comments (post_id, user_id) WHERE is_deleted = false;`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_follows_follower
     ON social_follows (follower_id, following_id);`,
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hidden_posts_user_post
     ON hidden_posts (user_id, post_id);`,
];

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting feed read-performance index migration...');
    for (const statement of INDEX_STATEMENTS) {
      const indexName = statement.match(/idx_\w+/)?.[0] ?? statement;
      console.log(`Creating ${indexName}...`);
      await client.query(statement);
    }
    console.log('✅ Migration completed successfully!');
  } catch (error) {
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
