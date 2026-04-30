/**
 * run-fts-indexes.ts
 * Phase 1B: Create FTS GIN indexes for Social & Users tables
 * Run with: npx ts-node --skip-project prisma/run-fts-indexes.ts
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const indexes = [
  {
    name: "idx_users_search",
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search
          ON users
          USING gin(to_tsvector('english', name || ' ' || coalesce(social_username, '')))`,
  },
  {
    name: "idx_posts_content_fts",
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_content_fts
          ON social_posts
          USING gin(to_tsvector('english', coalesce(content, '')))`,
  },
  {
    name: "idx_comments_content_fts",
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_content_fts
          ON social_comments
          USING gin(to_tsvector('english', content))`,
  },
  {
    name: "idx_reposts_caption_fts",
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reposts_caption_fts
          ON social_reposts
          USING gin(to_tsvector('english', coalesce(caption, '')))`,
  },
  {
    name: "idx_hashtags_tag",
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hashtags_tag
          ON hashtags(tag varchar_pattern_ops)`,
  },
  // --- Group 2: Pets & Listings ---
  {
    name: "idx_pets_search",
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_search
          ON pets
          USING gin(to_tsvector('english', pet_name || ' ' || coalesce(pet_breed, '') || ' ' || coalesce(description, '')))`,
  },
  {
    name: "idx_lost_found_search",
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lost_found_search
          ON lost_and_found_posts
          USING gin(to_tsvector('english', coalesce(pet_description, '') || ' ' || coalesce(location, '')))`,
  },
  // --- Group 3: Bazaar ---
  {
    name: "idx_products_search",
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search
          ON bazaar_products
          USING gin(to_tsvector('english', title || ' ' || coalesce(description, '')))`,
  },
  {
    name: "idx_bazaar_categories_search",
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bazaar_categories_search
          ON bazaar_categories
          USING gin(to_tsvector('english', name))`,
  },
  {
    name: "idx_bazaar_collections_search",
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bazaar_collections_search
          ON bazaar_collections
          USING gin(to_tsvector('english', name))`,
  },
  // --- Group 4: Providers ---
  {
    name: "idx_clinics_search",
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clinics_search
          ON clinics
          USING gin(to_tsvector('english', name || ' ' || coalesce(address, '')))`,
  },
  {
    name: "idx_rescue_shelters_search",
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rescue_shelters_search
          ON rescue_shelters
          USING gin(to_tsvector('english', shelter_name || ' ' || coalesce(address, '')))`,
  },
  {
    name: "idx_vendors_search",
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendors_search
          ON vendors
          USING gin(to_tsvector('english', shop_name || ' ' || coalesce(address, '')))`,
  },
  {
    name: "idx_vets_search",
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vets_search
          ON vets
          USING gin(to_tsvector('english', coalesce(specialization, '') || ' ' || coalesce(qualifications, '')))`,
  },
  // --- Group 5: Metadata ---
  {
    name: "idx_pet_category_search",
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pet_category_search
          ON pet_category
          USING gin(to_tsvector('english', category_name))`,
  },
  {
    name: "idx_pet_tags_search",
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pet_tags_search
          ON pet_tags
          USING gin(to_tsvector('english', tag_name))`,
  },
];

async function run() {
  // CONCURRENTLY cannot run inside a transaction block
  // so we use a plain client per statement
  for (const idx of indexes) {
    const client = await pool.connect();
    try {
      console.log(`⏳  Creating ${idx.name}...`);
      await client.query(idx.sql);
      console.log(`✅  ${idx.name} done`);
    } catch (err: any) {
      console.error(`❌  ${idx.name} failed:`, err.message);
    } finally {
      client.release();
    }
  }
  await pool.end();
  console.log("\n🎉  All FTS indexes applied.");
}

run().catch(console.error);
