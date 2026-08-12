-- Add google_place_id and is_active to clinics table
-- google_place_id: dedup key for Google Places re-scrapes/imports
-- is_active: lets admins deactivate a listing without deleting it (hidden from public site)
--
-- NOTE: both columns were already applied directly to the database in prior sessions;
-- this file exists so the migration is recorded in the repo and re-runnable elsewhere
-- (e.g. a fresh dev DB). Both statements are idempotent (IF NOT EXISTS).

BEGIN;

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE clinics SET is_active = true WHERE is_active IS NULL;

COMMIT;
