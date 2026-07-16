-- ============================================================
-- Migration 008: Add social verified badge + reset founders club
-- Adds users.social_verified — the "blue check" identity badge shown
-- next to a poster's name/username in the social feed, comments, and
-- replies. Distinct from phone_verified (phone OTP) and founding_club
-- (founders club membership, unrelated to identity verification).
-- Also resets founding_club to false for all existing users.
-- ============================================================

BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS social_verified BOOLEAN NOT NULL DEFAULT false;

UPDATE users SET founding_club = false WHERE founding_club IS DISTINCT FROM false;

COMMIT;
