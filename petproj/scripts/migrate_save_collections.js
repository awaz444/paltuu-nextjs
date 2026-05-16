const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Creating save_collections table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS save_collections (
          collection_id BIGSERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL,
          name VARCHAR(100) NOT NULL,
          is_default BOOLEAN DEFAULT false,
          cover_image_url TEXT,
          post_count INT DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          CONSTRAINT fk_collections_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
          UNIQUE(user_id, name)
      );
    `);

    console.log('Creating idx_collections_user...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_collections_user ON save_collections(user_id, created_at DESC);
    `);

    console.log('Creating saved_posts table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_posts (
          save_id BIGSERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL,
          post_id BIGINT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now(),
          CONSTRAINT fk_saved_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
          CONSTRAINT fk_saved_post FOREIGN KEY (post_id) REFERENCES social_posts(post_id) ON DELETE CASCADE,
          UNIQUE(user_id, post_id)
      );
    `);

    console.log('Creating idx_saved_posts_user...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id, created_at DESC);
    `);

    console.log('Creating idx_saved_posts_lookup...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_saved_posts_lookup ON saved_posts(user_id, post_id);
    `);

    console.log('Creating collection_posts table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS collection_posts (
          collection_id BIGINT NOT NULL,
          save_id BIGINT NOT NULL,
          added_at TIMESTAMPTZ DEFAULT now(),
          PRIMARY KEY (collection_id, save_id),
          CONSTRAINT fk_cp_collection FOREIGN KEY (collection_id) REFERENCES save_collections(collection_id) ON DELETE CASCADE,
          CONSTRAINT fk_cp_save FOREIGN KEY (save_id) REFERENCES saved_posts(save_id) ON DELETE CASCADE
      );
    `);

    console.log('Creating idx_collection_posts...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_collection_posts ON collection_posts(collection_id, added_at DESC);
    `);

    await client.query('COMMIT');
    console.log('Migration successful!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
