-- Add slug to clinics table
-- slug: human-readable, unique URL segment for /pet-care/clinic/[slug]
-- (kept nullable + backfilled separately via scripts/backfill_clinic_slugs.js so
-- existing numeric-id links keep working as a fallback during rollout)

BEGIN;

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_clinics_slug ON clinics(slug);

COMMIT;
