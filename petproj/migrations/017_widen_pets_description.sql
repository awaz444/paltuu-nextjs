-- ============================================================
-- Migration 017: Widen pets.description to match the listing form
--
-- The create-listing form ("The Story" textarea) accepts up to 1000
-- characters, but pets.description was VARCHAR(255). Any listing with a
-- longer story failed the INSERT in app/api/v1/pets/route.ts as a Postgres
-- "value too long for type character varying" error (SQLSTATE 22001),
-- surfacing to the user as a generic 500.
--
-- Widening to VARCHAR(1000) lines the column up with the form's maxLength.
-- This is a metadata-only change on Postgres (no table rewrite, no data
-- loss) since it only raises the length limit. The API now also validates
-- the field against the same 1000-char cap so an over-limit value comes
-- back as a 400.
-- ============================================================

BEGIN;

ALTER TABLE pets
  ALTER COLUMN description TYPE VARCHAR(1000);

COMMIT;
