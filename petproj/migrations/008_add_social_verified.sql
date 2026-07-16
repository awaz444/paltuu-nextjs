-- ============================================================
-- Migration 008: Reset founders club (verified badge already existed)
-- public.users already had a `verified` boolean (2 users set true) —
-- that column is reused as the "blue check" identity badge shown next
-- to a poster's name/username in the social feed, comments, and
-- replies. No new column needed for that.
--
-- This migration only resets founding_club to false for all existing
-- users. (A `social_verified` column was briefly added and dropped
-- here after discovering `verified` already served this purpose —
-- see git history if you need the full story.)
-- ============================================================

BEGIN;

ALTER TABLE users DROP COLUMN IF EXISTS social_verified;

UPDATE users SET founding_club = false WHERE founding_club IS DISTINCT FROM false;

COMMIT;
