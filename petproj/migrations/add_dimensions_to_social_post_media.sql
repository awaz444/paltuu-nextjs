-- Migration: width/height on social_post_media (PALTU-159)
-- Run this in your PostgreSQL DB (e.g. via psql or your DB client).
--
-- Feed cards size each photo/video frame from the media's own aspect ratio
-- instead of a fixed box, so portrait phone media no longer gets black side
-- bars (web) or a thin cropped strip (app). Both columns are nullable: a row
-- without them keeps the old fixed frame until it is measured.
--
-- Written by create-post / quote-repost (from the upload response the app
-- already sends), by the video confirm step (poster size) and by the
-- MediaConvert webhook (real output size). Existing rows:
--   npx tsx scripts/backfill_media_dimensions.ts            # dry run
--   npx tsx scripts/backfill_media_dimensions.ts --apply
--
-- The code reads and writes these columns defensively, so deploying it before
-- this migration is safe; nothing is sized until it runs.

ALTER TABLE social_post_media
    ADD COLUMN IF NOT EXISTS width  INTEGER,
    ADD COLUMN IF NOT EXISTS height INTEGER;
