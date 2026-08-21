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
//   - express_vet_rate_cards                        — PLACEHOLDER starting prices, see warning below
//
// ⚠️ Rate card prices below are PLACEHOLDERS, not real numbers from ops. Replace them once
// paltuu-vets-at-home-rate-sheet.csv is filled in — see the Vets at Home handoff doc §12 Phase A.
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
  grooming: {
    fields: [
      { key: 'grooming_type', label: 'What grooming services do you need?', type: 'multiselect', options: ['Bath & Shampoo', 'Haircut/Trim', 'Nail Trimming', 'Ear Cleaning', 'De-shedding Treatment', 'Flea/Tick Treatment'], required: true },
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

// PLACEHOLDER prices only — see warning at the top of this file.
const RATE_CARDS: Array<{ category: string; species: string; starting_price_pkr: number }> = [
  { category: 'express_vet', species: 'dog', starting_price_pkr: 3000 },
  { category: 'express_vet', species: 'cat', starting_price_pkr: 3000 },
  { category: 'express_vet', species: 'other', starting_price_pkr: 3500 },
  { category: 'normal_vet', species: 'dog', starting_price_pkr: 2000 },
  { category: 'normal_vet', species: 'cat', starting_price_pkr: 2000 },
  { category: 'normal_vet', species: 'other', starting_price_pkr: 2500 },
  { category: 'neutering', species: 'dog', starting_price_pkr: 6000 },
  { category: 'neutering', species: 'cat', starting_price_pkr: 4000 },
  { category: 'spaying', species: 'dog', starting_price_pkr: 8000 },
  { category: 'spaying', species: 'cat', starting_price_pkr: 5500 },
  { category: 'vaccination', species: 'dog', starting_price_pkr: 1500 },
  { category: 'vaccination', species: 'cat', starting_price_pkr: 1500 },
  { category: 'grooming', species: 'dog', starting_price_pkr: 2500 },
  { category: 'grooming', species: 'cat', starting_price_pkr: 2000 },
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

    for (const rc of RATE_CARDS) {
      await client.query(
        `INSERT INTO express_vet_rate_cards (category, species, sub_service, city_id, starting_price_pkr, is_active)
         VALUES ($1, $2, NULL, $3, $4, TRUE)
         ON CONFLICT (category, species, sub_service, city_id) DO UPDATE
           SET starting_price_pkr = EXCLUDED.starting_price_pkr,
               updated_at = CURRENT_TIMESTAMP`,
        [rc.category, rc.species, KARACHI_CITY_ID, rc.starting_price_pkr]
      );
    }

    await client.query('COMMIT');
    console.log(`✅ Seed complete. ${RATE_CARDS.length} rate cards + 3 app_settings keys upserted.`);
    console.log('⚠️  Rate card prices are PLACEHOLDERS — replace once the real rate sheet is filled in.');
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
