import pg from 'pg';
const { Pool } = pg;
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { matchBreed, type BreedForMatch, type BreedMatch } from '../lib/breeds';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Fills breed_id on pets and pet_profiles from their typed breed (PALTU-70).
// Run from petproj/, after db/breeds_migration.ts:
//   npx tsx db/breed_backfill.ts                      dry run: report + review CSV, writes nothing
//   npx tsx db/breed_backfill.ts --apply              writes confident matches
//   npx tsx db/breed_backfill.ts --apply --no-fuzzy   ...without one-typo matches
//   --out <file.csv>                                  where the review CSV goes (default: temp dir)
//
// Only rows whose breed_id is still NULL are touched, and the typed text is never
// changed, so it is safe to re-run — e.g. to pick up listings created after the
// last run, until the app sends breed_id itself. Blank, junk and unmatched rows
// are left NULL and listed in the CSV for a person to settle.

// IMPORTANT: the live database is on AWS RDS behind NEW_DATABASE_URL (see db/index.ts).
const connectionString = process.env.NEW_DATABASE_URL;
if (!connectionString) {
  throw new Error('NEW_DATABASE_URL environment variable is not set.');
}

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const ALLOW_FUZZY = !args.includes('--no-fuzzy');
const outIdx = args.indexOf('--out');
const OUT = outIdx >= 0 ? args[outIdx + 1] : path.join(os.tmpdir(), `breed_backfill_${Date.now()}.csv`);

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

type Row = { table: 'pets' | 'pet_profiles'; id: number; categoryId: number | null; species: string; text: string | null; approved: boolean | null };
type Result = Row & BreedMatch & { breedName: string };

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

async function run() {
  const client = await pool.connect();
  try {
    const breedRes = await client.query(
      `SELECT breed_id, category_id, slug, name, kind, aliases, parent_breed_id FROM breeds WHERE is_active`
    );
    if (breedRes.rowCount === 0) throw new Error('breeds table is empty — run db/breeds_migration.ts first');
    const byCategory = new Map<number, BreedForMatch[]>();
    const nameById = new Map<number, string>();
    for (const b of breedRes.rows) {
      if (!byCategory.has(b.category_id)) byCategory.set(b.category_id, []);
      byCategory.get(b.category_id)!.push(b);
      nameById.set(b.breed_id, b.name);
    }

    // Pet profiles store species as a name; resolve it the same way list-for-adoption does.
    const cats = await client.query('SELECT category_id, category_name FROM pet_category');
    const categoryByName = new Map<string, number>(cats.rows.map((c) => [c.category_name.toLowerCase(), c.category_id]));
    const speciesById = new Map<number, string>(cats.rows.map((c) => [c.category_id, c.category_name]));

    const pets = await client.query(
      `SELECT pet_id, pet_type, pet_breed, approved FROM pets WHERE breed_id IS NULL ORDER BY pet_id`
    );
    const profiles = await client.query(
      `SELECT pet_profile_id, species, breed FROM pet_profiles WHERE breed_id IS NULL ORDER BY pet_profile_id`
    );
    const rows: Row[] = [
      ...pets.rows.map((r): Row => ({
        table: 'pets', id: r.pet_id, categoryId: r.pet_type,
        species: speciesById.get(r.pet_type) ?? '', text: r.pet_breed, approved: r.approved,
      })),
      ...profiles.rows.map((r): Row => ({
        table: 'pet_profiles', id: r.pet_profile_id, categoryId: categoryByName.get(String(r.species).toLowerCase()) ?? null,
        species: r.species, text: r.breed, approved: null,
      })),
    ];

    const results: Result[] = [];
    let noList = 0;
    for (const r of rows) {
      const list = r.categoryId != null ? byCategory.get(r.categoryId) : undefined;
      if (!list) { noList++; continue; } // rabbits, fish etc. have no breed question
      const m = matchBreed(r.text, list);
      if (m.method === 'fuzzy' && !ALLOW_FUZZY) m.breed_id = null;
      results.push({ ...r, ...m, breedName: m.breed_id ? nameById.get(m.breed_id)! : '' });
    }

    const toWrite = results.filter((r) => r.breed_id != null);

    // Report
    const tally = (keyOf: (r: Result) => string, list: Result[]) =>
      [...list.reduce((m, r) => m.set(keyOf(r), (m.get(keyOf(r)) ?? 0) + 1), new Map<string, number>())]
        .sort((a, b) => b[1] - a[1]);
    console.log(`\nRows with no breed_id: ${rows.length} (${pets.rowCount} listings, ${profiles.rowCount} pet profiles)`);
    console.log(`Species without a breed list, skipped: ${noList}`);
    console.log('\nBy outcome:');
    for (const [k, n] of tally((r) => r.method, results)) console.log(`  ${k.padEnd(9)} ${n}`);
    console.log('\nWould set, by breed:');
    for (const [k, n] of tally((r) => `${r.species} › ${r.breedName}`, toWrite)) console.log(`  ${k.padEnd(32)} ${n}`);

    // Review CSV: every row the script looked at, so a person can check the fuzzy
    // and contains calls as well as settle the unmatched ones.
    const header = ['table', 'id', 'species', 'typed_breed', 'approved', 'outcome', 'matched_breed', 'via'];
    const lines = [header.join(',')].concat(
      results
        .sort((a, b) => Number(a.breed_id != null) - Number(b.breed_id != null) || a.method.localeCompare(b.method))
        .map((r) => [r.table, r.id, r.species, r.text, r.approved, r.method, r.breedName, r.via].map(csvCell).join(','))
    );
    fs.writeFileSync(OUT, lines.join('\n') + '\n');
    console.log(`\nReview file: ${OUT}`);

    if (!APPLY) {
      console.log(`\nDry run — nothing written. ${toWrite.length} rows would get a breed_id. Re-run with --apply.`);
      return;
    }

    await client.query('BEGIN');
    for (const table of ['pets', 'pet_profiles'] as const) {
      const idCol = table === 'pets' ? 'pet_id' : 'pet_profile_id';
      const batch = toWrite.filter((r) => r.table === table);
      if (!batch.length) continue;
      const res = await client.query(
        `UPDATE ${table} t SET breed_id = v.breed_id
           FROM unnest($1::int[], $2::int[]) AS v(id, breed_id)
          WHERE t.${idCol} = v.id AND t.breed_id IS NULL`,
        [batch.map((r) => r.id), batch.map((r) => r.breed_id)]
      );
      console.log(`  ${table}: ${res.rowCount} rows updated`);
    }
    await client.query('COMMIT');
    console.log('✅ Breed backfill applied.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Breed backfill failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(() => process.exit(1));
