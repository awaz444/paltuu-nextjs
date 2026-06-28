import pg from 'pg';
const { Pool } = pg;
import * as dotenv from 'dotenv';
import path from 'path';

// Run AFTER db/social_feed_migration.ts. Idempotent (ON CONFLICT (slug) DO NOTHING).
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.NEW_DATABASE_URL;
if (!connectionString) {
  throw new Error('NEW_DATABASE_URL environment variable is not set.');
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

// slug, label, category (plan §2). Admins can add more later via the taxonomy manager.
const TAGS: Array<{ slug: string; label: string; category: string }> = [
  // species
  { slug: 'cat', label: 'Cat', category: 'species' },
  { slug: 'dog', label: 'Dog', category: 'species' },
  { slug: 'bird', label: 'Bird', category: 'species' },
  { slug: 'rabbit', label: 'Rabbit', category: 'species' },
  { slug: 'fish', label: 'Fish', category: 'species' },
  { slug: 'reptile', label: 'Reptile', category: 'species' },
  { slug: 'other-animal', label: 'Other Animal', category: 'species' },
  // topic
  { slug: 'training', label: 'Training', category: 'topic' },
  { slug: 'grooming', label: 'Grooming', category: 'topic' },
  { slug: 'health', label: 'Health & Vet', category: 'topic' },
  { slug: 'adoption', label: 'Adoption', category: 'topic' },
  { slug: 'lost-found', label: 'Lost & Found', category: 'topic' },
  { slug: 'funny', label: 'Funny', category: 'topic' },
  { slug: 'milestone', label: 'Milestone', category: 'topic' },
  { slug: 'diary', label: 'Diary', category: 'topic' },
  // content_type
  { slug: 'photo', label: 'Photo', category: 'content_type' },
  { slug: 'video', label: 'Video', category: 'content_type' },
  { slug: 'text', label: 'Text Post', category: 'content_type' },
  { slug: 'meme', label: 'Meme', category: 'content_type' },
  // mood
  { slug: 'cute', label: 'Cute', category: 'mood' },
  { slug: 'educational', label: 'Educational', category: 'mood' },
  { slug: 'question', label: 'Question', category: 'mood' },
  { slug: 'rant', label: 'Rant', category: 'mood' },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log(`Seeding ${TAGS.length} content tags...`);
    await client.query('BEGIN');

    // sort_order is per-category, in the order listed above.
    const perCategoryCount: Record<string, number> = {};
    for (const tag of TAGS) {
      const order = perCategoryCount[tag.category] ?? 0;
      perCategoryCount[tag.category] = order + 1;
      await client.query(
        `INSERT INTO content_tags (slug, label, category, sort_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO NOTHING`,
        [tag.slug, tag.label, tag.category, order]
      );
    }

    await client.query('COMMIT');
    const count = await client.query('SELECT COUNT(*)::int AS n FROM content_tags');
    console.log(`✅ Seed complete. content_tags now has ${count.rows[0].n} rows.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
