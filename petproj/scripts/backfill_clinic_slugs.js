// One-off backfill: generate a unique slug for every clinic, clinic 496 first.
// Safe to re-run — only fills rows where slug IS NULL.

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.NEW_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureColumn(client) {
  await client.query(`
    ALTER TABLE clinics ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_clinics_slug ON clinics(slug);
  `);
}

async function assignSlug(client, clinic, takenSlugs) {
  const base = slugify(clinic.name) || `clinic-${clinic.clinic_id}`;
  const withCity = clinic.city ? `${base}-${slugify(clinic.city)}` : base;

  let candidate = withCity;
  let suffix = 2;
  while (takenSlugs.has(candidate)) {
    candidate = `${withCity}-${suffix}`;
    suffix += 1;
  }
  // Final safety net: if somehow still colliding after suffixing, fall back to id.
  if (takenSlugs.has(candidate)) candidate = `${withCity}-${clinic.clinic_id}`;

  await client.query('UPDATE clinics SET slug = $1 WHERE clinic_id = $2', [
    candidate,
    clinic.clinic_id,
  ]);
  takenSlugs.add(candidate);
  return candidate;
}

async function main() {
  const client = await pool.connect();
  try {
    await ensureColumn(client);

    const existing = await client.query('SELECT slug FROM clinics WHERE slug IS NOT NULL');
    const takenSlugs = new Set(existing.rows.map((r) => r.slug));

    // ── Clinic 496 first ──────────────────────────────────────────────────
    const target = await client.query(
      'SELECT clinic_id, name, city, slug FROM clinics WHERE clinic_id = $1',
      [496]
    );
    if (target.rowCount === 0) {
      console.log('Clinic 496 not found.');
    } else {
      const clinic = target.rows[0];
      if (clinic.slug) {
        console.log(`Clinic 496 already has slug: ${clinic.slug}`);
      } else {
        const slug = await assignSlug(client, clinic, takenSlugs);
        console.log(`Clinic 496 -> https://www.paltuu.pk/pet-care/clinic/${slug}`);
      }
    }

    // ── All remaining clinics ────────────────────────────────────────────
    const rest = await client.query(
      'SELECT clinic_id, name, city FROM clinics WHERE slug IS NULL ORDER BY clinic_id'
    );
    console.log(`Backfilling ${rest.rowCount} remaining clinic(s)...`);
    for (const clinic of rest.rows) {
      const slug = await assignSlug(client, clinic, takenSlugs);
      console.log(`  ${clinic.clinic_id} -> ${slug}`);
    }

    console.log('Done.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
