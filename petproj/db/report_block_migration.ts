import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting Report & Block migration...');
    await client.query('BEGIN');

    // 1. Create app_settings table
    console.log('Creating app_settings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value JSONB NOT NULL,
        description TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Insert auto-hide threshold
    await client.query(`
      INSERT INTO app_settings (setting_key, setting_value, description)
      VALUES ('auto_hide_threshold', '10', 'Number of reports before a post is automatically hidden')
      ON CONFLICT (setting_key) DO NOTHING;
    `);

    // 2. Create reports table
    console.log('Creating reports table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        report_id BIGSERIAL PRIMARY KEY,
        reporter_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'user', 'comment')),
        target_id BIGINT NOT NULL,
        reason_code VARCHAR(30) NOT NULL,
        additional_note TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
        admin_note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        reviewed_at TIMESTAMPTZ,
        UNIQUE(reporter_id, target_type, target_id)
      );
    `);

    // 3. Create user_blocks table
    console.log('Creating user_blocks table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_blocks (
        block_id BIGSERIAL PRIMARY KEY,
        blocker_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        blocked_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(blocker_id, blocked_id)
      );
    `);

    // 4. Alter social_posts table
    console.log('Altering social_posts table...');
    await client.query(`
      ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS report_count INT DEFAULT 0;
      ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
    `);

    // 5. Create Trigger for auto-hiding posts
    console.log('Creating auto-hide trigger...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_post_report_count()
      RETURNS TRIGGER AS $$
      DECLARE
        threshold INT;
      BEGIN
        IF NEW.target_type = 'post' THEN
          -- Get threshold from settings
          SELECT (setting_value::text)::int INTO threshold FROM app_settings WHERE setting_key = 'auto_hide_threshold';
          IF threshold IS NULL THEN
            threshold := 10;
          END IF;

          UPDATE social_posts
          SET report_count = report_count + 1,
              is_hidden = (report_count + 1 >= threshold)
          WHERE post_id = NEW.target_id;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trg_reports_insert ON reports;
      CREATE TRIGGER trg_reports_insert
      AFTER INSERT ON reports
      FOR EACH ROW
      EXECUTE FUNCTION update_post_report_count();
    `);

    // 6. Create Indexes
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
      
      CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON user_blocks(blocker_id);
      CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON user_blocks(blocked_id);
      CREATE INDEX IF NOT EXISTS idx_blocks_pair ON user_blocks(blocker_id, blocked_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
