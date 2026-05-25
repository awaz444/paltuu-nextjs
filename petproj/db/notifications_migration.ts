import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pool = new Pool({
  connectionString: process.env.NEW_DATABASE_URL,
});

async function runMigration() {
  console.log('Starting notifications system migration...');
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('1. Creating user_devices table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_devices (
        device_id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        fcm_token VARCHAR(255) UNIQUE NOT NULL,
        device_platform VARCHAR(20) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log('Creating index on user_devices(user_id)...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
    `);

    console.log('2. Dropping old notifications table...');
    await client.query(`
      DROP TABLE IF EXISTS notifications CASCADE;
    `);

    console.log('3. Creating new notifications table...');
    await client.query(`
      CREATE TABLE notifications (
        notification_id BIGSERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50),
        entity_id BIGINT,
        deep_link VARCHAR(255),
        image_url VARCHAR(255),
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log('Creating indexes on notifications...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON notifications(user_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
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
