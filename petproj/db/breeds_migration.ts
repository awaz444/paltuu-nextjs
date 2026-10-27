import pg from 'pg';
const { Pool } = pg;
import * as dotenv from 'dotenv';
import path from 'path';
import { BREED_SEED } from '../lib/breeds';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Breed list (PALTU-70). Run from petproj/:
//   npx tsx db/breeds_migration.ts
//
// Additive only, so the live app and website keep working unchanged:
//   - new `breeds` table, seeded from BREED_SEED (lib/breeds.ts)
//   - nullable `breed_id` on pets and pet_profiles
// pets.pet_breed and pet_profiles.breed are not touched; they stay what the app
// and website read and write until the breed pickers ship. Safe to re-run: the
// seed upserts by (category_id, slug), so editing BREED_SEED and re-running
// updates names, aliases and order in place.

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
    console.log('Starting Breeds migration...');
    await client.query('BEGIN');

    console.log('Creating breeds table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS breeds (
        breed_id        SERIAL PRIMARY KEY,
        category_id     INT NOT NULL REFERENCES pet_category(category_id),
        name            VARCHAR(100) NOT NULL,
        slug            VARCHAR(100) NOT NULL,
        kind            VARCHAR(20) NOT NULL DEFAULT 'breed'
                          CHECK (kind IN ('breed', 'street', 'mixed', 'not_sure', 'other')),
        aliases         TEXT[] NOT NULL DEFAULT '{}',
        parent_breed_id INT REFERENCES breeds(breed_id) ON DELETE SET NULL,
        sort_order      INT NOT NULL DEFAULT 0,
        is_active       BOOLEAN NOT NULL DEFAULT TRUE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_breeds_category_slug UNIQUE (category_id, slug)
      );
      CREATE INDEX IF NOT EXISTS idx_breeds_category_order ON breeds (category_id, sort_order);
    `);

    console.log('Adding breed_id to pets and pet_profiles...');
    await client.query(`
      ALTER TABLE pets ADD COLUMN IF NOT EXISTS breed_id INT REFERENCES breeds(breed_id) ON DELETE SET NULL;
      ALTER TABLE pet_profiles ADD COLUMN IF NOT EXISTS breed_id INT REFERENCES breeds(breed_id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_pets_breed_id ON pets (breed_id);
      CREATE INDEX IF NOT EXISTS idx_pet_profiles_breed_id ON pet_profiles (breed_id);
    `);

    console.log('Seeding breed list...');
    for (const [species, list] of Object.entries(BREED_SEED)) {
      const cat = await client.query(
        'SELECT category_id FROM pet_category WHERE LOWER(category_name) = LOWER($1) LIMIT 1',
        [species]
      );
      if (cat.rowCount === 0) throw new Error(`No pet_category row for species '${species}'`);
      const categoryId = cat.rows[0].category_id;

      for (const [i, b] of list.entries()) {
        await client.query(
          `INSERT INTO breeds (category_id, name, slug, kind, aliases, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (category_id, slug) DO UPDATE
             SET name = EXCLUDED.name, kind = EXCLUDED.kind, aliases = EXCLUDED.aliases,
                 sort_order = EXCLUDED.sort_order, updated_at = now()`,
          [categoryId, b.name, b.slug, b.kind, b.aliases, (i + 1) * 10]
        );
      }
      // Second pass: parents can only be linked once every slug exists.
      for (const b of list) {
        await client.query(
          `UPDATE breeds c SET parent_breed_id = p.breed_id
             FROM breeds p
            WHERE c.category_id = $1 AND c.slug = $2
              AND p.category_id = $1 AND p.slug = $3`,
          [categoryId, b.slug, b.parent ?? null]
        );
        if (!b.parent) {
          await client.query(
            'UPDATE breeds SET parent_breed_id = NULL WHERE category_id = $1 AND slug = $2',
            [categoryId, b.slug]
          );
        }
      }
      console.log(`  ${species}: ${list.length} breeds`);
    }

    await client.query('COMMIT');
    console.log('✅ Breeds migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(() => process.exit(1));
