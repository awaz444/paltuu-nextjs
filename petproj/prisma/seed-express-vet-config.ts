import pg from 'pg';
const { Pool } = pg;
import * as dotenv from 'dotenv';
import path from 'path';

// Run AFTER migrations/016_express_vet_schema.sql. Idempotent (ON CONFLICT DO UPDATE / DO NOTHING).
//
// Seeds:
//   - app_settings['express_vet_enabled_cities']    — city gate (Karachi only at launch)
//   - app_settings['express_vet_request_expiry_hours'] — per-category pending_dispatch expiry window
//   - app_settings['express_vet_questionnaires']    — first-draft triage form schema, per category/species
//   - express_vet_rate_cards                        — real starting prices, see paltuu-vets-at-home-rate-sheet.csv
//
// Rate cards below come from paltuu-vets-at-home-rate-sheet.csv (dispatcher-given numbers,
// marked "Dispatcher" there) plus calculated estimates for anything the dispatcher didn't give
// a figure for (marked "Calculated" there — e.g. Normal Vet, and most individual grooming
// items, back-derived from the dispatcher's "Quick Clean" bundle total). Deliberate
// simplifications made when seeding:
//   - No size(dog)/coat(cat) price variation — one flat price per (category, species,
//     sub_service). `express_vet_rate_cards` has no size/coat column at all yet; adding real
//     variation would need a schema change, not done here.
//   - Vaccination is one flat price (5000) for both dog and cat — no species split, no
//     Core/Rabies/Full picker, per explicit founder direction.
//   - Grooming is priced as a real cart (see EXPRESS_VET_GROOMING_ITEM_KEYS in
//     lib/expressVet/catalog.ts and the client's service.tsx): every item below is
//     individually selectable, and the request's `sub_service` column stores a comma-joined
//     list of chosen keys, summed server-side in requests/route.ts. "quick_clean" (Medicated
//     Bath + Haircut/Trim + Nail Trim + Ear Cleaning) is a FIXED 5000 package price, not
//     derived from summing its parts — it's just another cart item, so a client can pick it
//     alone, pick individual items instead, or add extras on top of it.
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

const KARACHI_CITY_ID = 1;

type Field =
  | { key: string; label: string; type: 'select'; options: string[]; required: boolean }
  | { key: string; label: string; type: 'multiselect'; options: string[]; required: boolean }
  | { key: string; label: string; type: 'text'; required: boolean; placeholder?: string }
  | { key: string; label: string; type: 'boolean'; required: boolean }
  | { key: string; label: string; type: 'photo'; required: boolean };

const SYMPTOM_OPTIONS = [
  'Vomiting',
  'Diarrhea',
  'Not eating/drinking',
  'Lethargy/weakness',
  'Difficulty breathing',
  'Bleeding/wound',
  'Limping/injury',
  'Seizure',
  'Other',
];

const QUESTIONNAIRES: Record<string, Record<string, { fields: Field[] }> | { fields: Field[] }> = {
  express_vet: {
    dog: {
      fields: [
        { key: 'symptom_duration', label: 'How long has this been going on?', type: 'select', options: ['Just noticed', 'Today', '1-3 days', 'Longer'], required: true },
        { key: 'symptoms', label: 'What symptoms is your pet showing?', type: 'multiselect', options: SYMPTOM_OPTIONS, required: true },
        { key: 'severity', label: 'How would you describe the situation?', type: 'select', options: ['Mild — just concerned', 'Moderate — clearly unwell', 'Severe — this feels urgent'], required: true },
        { key: 'pet_age', label: "Pet's age", type: 'text', required: true, placeholder: 'e.g. 2 years' },
        { key: 'photo_of_issue', label: 'Add a photo of the issue (optional)', type: 'photo', required: false },
        { key: 'additional_details', label: 'Anything else the vet should know?', type: 'text', required: false },
      ],
    },
    cat: {
      fields: [
        { key: 'symptom_duration', label: 'How long has this been going on?', type: 'select', options: ['Just noticed', 'Today', '1-3 days', 'Longer'], required: true },
        { key: 'symptoms', label: 'What symptoms is your pet showing?', type: 'multiselect', options: SYMPTOM_OPTIONS, required: true },
        { key: 'severity', label: 'How would you describe the situation?', type: 'select', options: ['Mild — just concerned', 'Moderate — clearly unwell', 'Severe — this feels urgent'], required: true },
        { key: 'pet_age', label: "Pet's age", type: 'text', required: true, placeholder: 'e.g. 2 years' },
        { key: 'photo_of_issue', label: 'Add a photo of the issue (optional)', type: 'photo', required: false },
        { key: 'additional_details', label: 'Anything else the vet should know?', type: 'text', required: false },
      ],
    },
    other: {
      fields: [
        { key: 'species_detail', label: 'What kind of pet is this?', type: 'text', required: true, placeholder: 'e.g. parrot, rabbit, hamster' },
        { key: 'symptom_duration', label: 'How long has this been going on?', type: 'select', options: ['Just noticed', 'Today', '1-3 days', 'Longer'], required: true },
        { key: 'severity', label: 'How would you describe the situation?', type: 'select', options: ['Mild — just concerned', 'Moderate — clearly unwell', 'Severe — this feels urgent'], required: true },
        { key: 'symptom_description', label: 'Describe the symptoms', type: 'text', required: true },
        { key: 'photo_of_issue', label: 'Add a photo of the issue (optional)', type: 'photo', required: false },
        { key: 'additional_details', label: 'Anything else the vet should know?', type: 'text', required: false },
      ],
    },
  },
  normal_vet: {
    dog: {
      fields: [
        { key: 'reason_for_visit', label: 'Reason for visit', type: 'select', options: ['Routine checkup', 'Ongoing condition follow-up', 'New symptom (non-urgent)', 'Second opinion', 'Other'], required: true },
        { key: 'symptoms', label: 'Any symptoms right now? (optional)', type: 'multiselect', options: SYMPTOM_OPTIONS, required: false },
        { key: 'pet_age', label: "Pet's age", type: 'text', required: true, placeholder: 'e.g. 2 years' },
        { key: 'preferred_time_window', label: 'Preferred time', type: 'select', options: ['Morning', 'Afternoon', 'Evening', 'Flexible'], required: true },
        { key: 'additional_details', label: 'Anything else the vet should know?', type: 'text', required: false },
      ],
    },
    cat: {
      fields: [
        { key: 'reason_for_visit', label: 'Reason for visit', type: 'select', options: ['Routine checkup', 'Ongoing condition follow-up', 'New symptom (non-urgent)', 'Second opinion', 'Other'], required: true },
        { key: 'symptoms', label: 'Any symptoms right now? (optional)', type: 'multiselect', options: SYMPTOM_OPTIONS, required: false },
        { key: 'pet_age', label: "Pet's age", type: 'text', required: true, placeholder: 'e.g. 2 years' },
        { key: 'preferred_time_window', label: 'Preferred time', type: 'select', options: ['Morning', 'Afternoon', 'Evening', 'Flexible'], required: true },
        { key: 'additional_details', label: 'Anything else the vet should know?', type: 'text', required: false },
      ],
    },
    other: {
      fields: [
        { key: 'species_detail', label: 'What kind of pet is this?', type: 'text', required: true, placeholder: 'e.g. parrot, rabbit, hamster' },
        { key: 'reason_for_visit', label: 'Reason for visit', type: 'select', options: ['Routine checkup', 'Ongoing condition follow-up', 'New symptom (non-urgent)', 'Second opinion', 'Other'], required: true },
        { key: 'preferred_time_window', label: 'Preferred time', type: 'select', options: ['Morning', 'Afternoon', 'Evening', 'Flexible'], required: true },
        { key: 'additional_details', label: 'Anything else the vet should know?', type: 'text', required: false },
      ],
    },
  },
  neutering: {
    fields: [
      { key: 'pet_age', label: "Pet's age", type: 'text', required: true, placeholder: 'e.g. 1.5 years' },
      { key: 'pet_weight_kg', label: 'Approximate weight (kg)', type: 'text', required: false },
      { key: 'previous_surgery_history', label: 'Has your pet had any surgery before?', type: 'boolean', required: true },
      { key: 'current_medications', label: 'Any current medications?', type: 'text', required: false },
      { key: 'vaccination_up_to_date', label: 'Are vaccinations up to date?', type: 'boolean', required: true },
      { key: 'photo_optional', label: 'Add a photo of your pet (optional)', type: 'photo', required: false },
      { key: 'additional_details', label: 'Anything else we should know?', type: 'text', required: false },
    ],
  },
  spaying: {
    fields: [
      { key: 'pet_age', label: "Pet's age", type: 'text', required: true, placeholder: 'e.g. 1.5 years' },
      { key: 'pet_weight_kg', label: 'Approximate weight (kg)', type: 'text', required: false },
      { key: 'previous_surgery_history', label: 'Has your pet had any surgery before?', type: 'boolean', required: true },
      { key: 'current_medications', label: 'Any current medications?', type: 'text', required: false },
      { key: 'vaccination_up_to_date', label: 'Are vaccinations up to date?', type: 'boolean', required: true },
      { key: 'in_heat_currently', label: 'Is your pet currently in heat?', type: 'boolean', required: true },
      { key: 'has_been_pregnant', label: 'Has your pet ever been pregnant?', type: 'boolean', required: true },
      { key: 'photo_optional', label: 'Add a photo of your pet (optional)', type: 'photo', required: false },
      { key: 'additional_details', label: 'Anything else we should know?', type: 'text', required: false },
    ],
  },
  vaccination: {
    fields: [
      { key: 'vaccine_type', label: 'What vaccination do you need?', type: 'select', options: ['Core vaccines (recommended)', 'Rabies', "Specific — I'll specify", 'Not sure — need guidance'], required: true },
      { key: 'pet_age', label: "Pet's age", type: 'text', required: true, placeholder: 'e.g. 6 months' },
      { key: 'last_vaccination_date', label: 'When was your pet last vaccinated?', type: 'select', options: ['Never vaccinated', 'Within the last year', 'Over a year ago', 'Not sure'], required: true },
      { key: 'additional_details', label: 'Anything else we should know?', type: 'text', required: false },
    ],
  },
  // No 'grooming_type' field here — which services the client wants is chosen on the
  // dedicated cart screen (service.tsx) before this questionnaire even renders, selecting it
  // again here via a checkbox list was the redundant, confusing second selection step.
  grooming: {
    fields: [
      { key: 'coat_condition', label: "Pet's coat condition", type: 'select', options: ['Normal', 'Matted/Tangled', 'Heavy shedding', 'Skin issues'], required: true },
      { key: 'pet_size', label: 'Pet size', type: 'select', options: ['Small (<10kg)', 'Medium (10-25kg)', 'Large (>25kg)'], required: true },
      { key: 'photo_optional', label: "Add a photo of your pet's coat (optional)", type: 'photo', required: false },
      { key: 'additional_details', label: 'Anything else the groomer should know?', type: 'text', required: false },
    ],
  },
};

const QUESTIONNAIRE_VERSION = '2026-08-21.1';

const EXPIRY_HOURS = {
  express_vet: 3,
  normal_vet: 24,
  neutering: 24,
  spaying: 24,
  vaccination: 24,
  grooming: 24,
};

// Real rate card data — see the comment block at the top of this file for sourcing notes.
const RATE_CARDS: Array<{ category: string; species: string; sub_service?: string; starting_price_pkr: number }> = [
  // Express Vet — dispatcher gave a flat 3000, no species split; Other gets a calculated
  // +33% exotic/specialized-handling premium.
  { category: 'express_vet', species: 'dog', starting_price_pkr: 3000 },
  { category: 'express_vet', species: 'cat', starting_price_pkr: 3000 },
  { category: 'express_vet', species: 'other', starting_price_pkr: 4000 },

  // Normal Vet — not given by the dispatcher; set per founder direction to stay below
  // Express Vet's 3000 (urgency premium) but not too far below it.
  { category: 'normal_vet', species: 'dog', starting_price_pkr: 2500 },
  { category: 'normal_vet', species: 'cat', starting_price_pkr: 2500 },
  { category: 'normal_vet', species: 'other', starting_price_pkr: 3300 },

  // Neutering / Spaying — dispatcher-given, exact.
  { category: 'neutering', species: 'dog', starting_price_pkr: 14000 },
  { category: 'neutering', species: 'cat', starting_price_pkr: 9000 },
  { category: 'spaying', species: 'dog', starting_price_pkr: 28000 },
  { category: 'spaying', species: 'cat', starting_price_pkr: 13000 },

  // Vaccination — flat 5000 for both dog and cat per founder direction (no species split).
  { category: 'vaccination', species: 'dog', starting_price_pkr: 5000 },
  { category: 'vaccination', species: 'cat', starting_price_pkr: 5000 },

  // Grooming — sub_service-keyed cart items, single flat price per (species, item), no
  // size/coat variation yet. Keys must match GROOMING_SUB_SERVICE_ORDER in
  // paltuu-reactnative/src/constants/expressVet.ts exactly.
  // "quick_clean" = Medicated Bath + Haircut/Trim + Nail Trim + Ear Cleaning, a FIXED 5000
  // package (dispatcher-given, not derived from summing its parts — renamed from "Full Groom
  // Package" since it's not a full groom). It's just another cart item like any other: a
  // client can pick it alone, pick individual items instead, or pick it AND add extras on top
  // (e.g. quick_clean + shave = 6500) — see service.tsx and requests/route.ts's cart pricing.
  { category: 'grooming', species: 'dog', sub_service: 'quick_clean', starting_price_pkr: 5000 }, // dispatcher, fixed package price
  { category: 'grooming', species: 'dog', sub_service: 'medicated_bath', starting_price_pkr: 1800 }, // calculated: quick_clean total minus haircut/nail trim/ear clean
  { category: 'grooming', species: 'dog', sub_service: 'haircut_trim', starting_price_pkr: 2000 }, // dispatcher
  { category: 'grooming', species: 'dog', sub_service: 'de_shedding', starting_price_pkr: 2200 }, // calculated: not given, priced near medicated bath tier
  { category: 'grooming', species: 'dog', sub_service: 'flea_tick_treatment', starting_price_pkr: 1500 }, // dispatcher
  { category: 'grooming', species: 'dog', sub_service: 'shave', starting_price_pkr: 1500 }, // dispatcher
  { category: 'grooming', species: 'dog', sub_service: 'nail_trimming', starting_price_pkr: 700 }, // calculated: quick_clean remainder
  { category: 'grooming', species: 'dog', sub_service: 'ear_cleaning', starting_price_pkr: 500 }, // calculated: quick_clean remainder
  { category: 'grooming', species: 'dog', sub_service: 'sanitary_trim', starting_price_pkr: 600 }, // calculated: not given, priced near nail trim/ear clean tier

  { category: 'grooming', species: 'cat', sub_service: 'quick_clean', starting_price_pkr: 3750 }, // calculated: 75% of dog baseline
  { category: 'grooming', species: 'cat', sub_service: 'medicated_bath', starting_price_pkr: 1350 },
  { category: 'grooming', species: 'cat', sub_service: 'haircut_trim', starting_price_pkr: 1500 },
  { category: 'grooming', species: 'cat', sub_service: 'de_shedding', starting_price_pkr: 1650 },
  { category: 'grooming', species: 'cat', sub_service: 'flea_tick_treatment', starting_price_pkr: 1150 },
  { category: 'grooming', species: 'cat', sub_service: 'shave', starting_price_pkr: 1150 },
  { category: 'grooming', species: 'cat', sub_service: 'nail_trimming', starting_price_pkr: 550 },
  { category: 'grooming', species: 'cat', sub_service: 'ear_cleaning', starting_price_pkr: 400 },
  { category: 'grooming', species: 'cat', sub_service: 'sanitary_trim', starting_price_pkr: 500 },
];

async function upsertSetting(client: pg.PoolClient, key: string, value: unknown, description: string) {
  await client.query(
    `INSERT INTO app_settings (setting_key, setting_value, description, updated_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     ON CONFLICT (setting_key) DO UPDATE
       SET setting_value = EXCLUDED.setting_value,
           description = EXCLUDED.description,
           updated_at = CURRENT_TIMESTAMP`,
    [key, JSON.stringify(value), description]
  );
}

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding express_vet app_settings + placeholder rate cards...');
    await client.query('BEGIN');

    await upsertSetting(
      client,
      'express_vet_enabled_cities',
      { city_ids: [KARACHI_CITY_ID] },
      'Vets at Home (Express Vet) city gate — cities where the feature is live. Karachi only at launch.'
    );

    await upsertSetting(
      client,
      'express_vet_request_expiry_hours',
      EXPIRY_HOURS,
      'Vets at Home (Express Vet) — hours a pending_dispatch request waits before auto-expiring, per category.'
    );

    await upsertSetting(
      client,
      'express_vet_questionnaires',
      { version: QUESTIONNAIRE_VERSION, schema: QUESTIONNAIRES },
      'Vets at Home (Express Vet) — first-draft triage questionnaire form schema, per category/species. Ops/founder can iterate without a deploy.'
    );

    // NOT `INSERT ... ON CONFLICT (category, species, sub_service, city_id)`: Postgres unique
    // constraints treat every NULL as distinct from every other NULL, so a conflict is never
    // detected for the ~14 rows here whose sub_service is NULL (every category except
    // grooming) — ON CONFLICT silently falls through to a fresh INSERT instead of updating the
    // existing row. Running this seed script twice with that approach produced 14 duplicate
    // rows in the real database (both old and new prices live at once, with `LIMIT 1` reads
    // picking one at random) before this was caught — see the Vets at Home handoff doc. This
    // NULL-safe delete-then-insert avoids relying on the constraint's conflict detection at all.
    for (const rc of RATE_CARDS) {
      await client.query(
        `DELETE FROM express_vet_rate_cards
         WHERE category = $1 AND species = $2 AND sub_service IS NOT DISTINCT FROM $3 AND city_id = $4`,
        [rc.category, rc.species, rc.sub_service ?? null, KARACHI_CITY_ID]
      );
      await client.query(
        `INSERT INTO express_vet_rate_cards (category, species, sub_service, city_id, starting_price_pkr, is_active)
         VALUES ($1, $2, $3, $4, $5, TRUE)`,
        [rc.category, rc.species, rc.sub_service ?? null, KARACHI_CITY_ID, rc.starting_price_pkr]
      );
    }

    await client.query('COMMIT');
    console.log(`✅ Seed complete. ${RATE_CARDS.length} rate cards + 3 app_settings keys upserted.`);
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
