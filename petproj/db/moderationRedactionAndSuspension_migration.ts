import pg from 'pg';
const { Pool } = pg;
import * as dotenv from 'dotenv';
import path from 'path';

// IMPORTANT: the live database is on AWS RDS behind NEW_DATABASE_URL (see db/index.ts).
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.NEW_DATABASE_URL;
if (!connectionString) {
    throw new Error('NEW_DATABASE_URL environment variable is not set.');
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

/**
 * Adds:
 *  - account suspension columns on `users` (auto-suspend on a SEVERE
 *    identity match — see db/moderationBackfillSweep.ts and the admin
 *    suspend/unsuspend route)
 *  - a 'redacted' moderation_state on social_comments (posts already have
 *    no CHECK constraint on moderation_state, so they need no DDL change —
 *    only the admin route's app-level VALID_STATES needed updating)
 */
async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Starting moderation redaction + suspension migration...');
        await client.query('BEGIN');

        console.log('Adding suspension columns to users...');
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;`);

        console.log('Creating index on users.is_suspended...');
        await client.query(
            `CREATE INDEX IF NOT EXISTS idx_users_is_suspended ON users (is_suspended) WHERE is_suspended = true;`
        );

        console.log('Widening social_comments moderation_state check constraint to allow \'redacted\'...');
        await client.query(`ALTER TABLE social_comments DROP CONSTRAINT IF EXISTS social_comments_moderation_state_check;`);
        await client.query(`
            ALTER TABLE social_comments
              ADD CONSTRAINT social_comments_moderation_state_check
              CHECK (moderation_state IN ('none', 'shadow_hidden', 'redacted'));
        `);

        await client.query('COMMIT');
        console.log('✅ Migration completed successfully!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
