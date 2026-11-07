-- Add is_approved to vet_reviews (PALTU-66)
--
-- PALTU-66 made every public vet review read filter on is_approved = true and
-- every new review insert as is_approved = false, and the vet panel's
-- approve / pending / approved routes already use the column. It was added to
-- the Prisma model but never to the database, so until this runs:
--   * every vet profile page (/pet-care/<vet_id>) shows "Vet Not Found"
--   * GET /api/v1/vets/<id> and POST /api/v1/reviews return 500
--   * the vet panel review screens fail
--
-- Existing reviews were all public before PALTU-66, so they are backfilled as
-- approved to keep them visible. Reviews written from now on default to
-- pending until a vet approves them in the vet panel.
--
-- Idempotent: safe to re-run (the backfill only touches rows still NULL).

BEGIN;

ALTER TABLE vet_reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN;

UPDATE vet_reviews SET is_approved = true WHERE is_approved IS NULL;

ALTER TABLE vet_reviews ALTER COLUMN is_approved SET DEFAULT false;

COMMIT;
