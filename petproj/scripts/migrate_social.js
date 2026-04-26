/**
 * Social Module Migration Script
 * Run with: node scripts/migrate_social.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.NEW_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const migrations = [
    {
        name: 'add_is_repost_to_social_posts',
        sql: `
            ALTER TABLE social_posts
                ADD COLUMN IF NOT EXISTS is_repost        BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS original_post_id BIGINT REFERENCES social_posts(post_id) ON DELETE SET NULL;
        `
    },
    {
        name: 'create_social_reposts',
        sql: `
            CREATE TABLE IF NOT EXISTS social_reposts (
                repost_id   BIGSERIAL PRIMARY KEY,
                post_id     BIGINT NOT NULL REFERENCES social_posts(post_id) ON DELETE CASCADE,
                user_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                caption     TEXT,
                created_at  TIMESTAMPTZ DEFAULT NOW(),
                CONSTRAINT unique_user_repost UNIQUE (post_id, user_id)
            );
        `
    },
    {
        name: 'idx_social_reposts_post',
        sql: `CREATE INDEX IF NOT EXISTS idx_social_reposts_post ON social_reposts (post_id);`
    },
    {
        name: 'idx_social_reposts_user',
        sql: `CREATE INDEX IF NOT EXISTS idx_social_reposts_user ON social_reposts (user_id);`
    },
    {
        name: 'idx_social_posts_user_created',
        sql: `CREATE INDEX IF NOT EXISTS idx_social_posts_user_created ON social_posts (user_id, created_at DESC);`
    },
    {
        name: 'idx_social_posts_cursor',
        sql: `CREATE INDEX IF NOT EXISTS idx_social_posts_cursor ON social_posts (created_at DESC, post_id);`
    },
    {
        name: 'idx_social_posts_original',
        sql: `CREATE INDEX IF NOT EXISTS idx_social_posts_original ON social_posts (original_post_id);`
    },
    {
        name: 'idx_social_follows_follower',
        sql: `CREATE INDEX IF NOT EXISTS idx_social_follows_follower ON social_follows (follower_id);`
    },
    {
        name: 'idx_social_follows_following',
        sql: `CREATE INDEX IF NOT EXISTS idx_social_follows_following ON social_follows (following_id);`
    },
    {
        name: 'idx_social_likes_user',
        sql: `CREATE INDEX IF NOT EXISTS idx_social_likes_user ON social_likes (user_id, created_at DESC);`
    },
    {
        name: 'idx_social_comments_post',
        sql: `CREATE INDEX IF NOT EXISTS idx_social_comments_post ON social_comments (post_id, created_at ASC);`
    },
];

async function run() {
    const client = await pool.connect();
    console.log('✅ Connected to database\n');

    let passed = 0;
    let failed = 0;

    for (const m of migrations) {
        try {
            await client.query(m.sql);
            console.log(`  ✅  ${m.name}`);
            passed++;
        } catch (err) {
            console.error(`  ❌  ${m.name}: ${err.message}`);
            failed++;
        }
    }

    client.release();
    await pool.end();

    console.log(`\n─────────────────────────────────────`);
    console.log(`Migration complete: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
}

run().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
