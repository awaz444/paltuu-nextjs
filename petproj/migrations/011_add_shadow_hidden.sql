-- ============================================================
-- Migration 011: Admin shadow-hide for posts and pet polaroids
--
-- `is_shadow_hidden = true` means the row stays fully visible to the user
-- who created it — their feed, their profile, their pet's gallery all look
-- completely normal — and is invisible to everyone else.
--
-- This is an ADMIN-ONLY moderation flag. There is no user-facing control to
-- set it, and it is never returned to the mobile app (see
-- lib/moderationRedaction.ts), because a shadow-hide the author can detect
-- is not a shadow-hide.
--
-- Deliberately a NEW column rather than reusing social_posts.is_hidden:
--   is_hidden       -> dropped for EVERYONE, author included (hard hide)
--   is_shadow_hidden-> dropped for everyone EXCEPT the author (silent hide)
-- The two are independent; a post can be under both.
--
-- Both defaults are false, so every existing row stays public.
-- ============================================================

BEGIN;

ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS is_shadow_hidden BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE pet_profile_photos
  ADD COLUMN IF NOT EXISTS is_shadow_hidden BOOLEAN NOT NULL DEFAULT false;

-- Feed/explore queries all filter `is_shadow_hidden = false` (or author
-- match), so a partial index over the visible rows keeps those scans cheap.
CREATE INDEX IF NOT EXISTS idx_social_posts_not_shadow_hidden_created
  ON social_posts (created_at DESC)
  WHERE is_shadow_hidden = false;

CREATE INDEX IF NOT EXISTS idx_pet_profile_photos_not_shadow_hidden
  ON pet_profile_photos (pet_profile_id, ordering)
  WHERE is_shadow_hidden = false;

-- The admin Post Browser filters on this state directly, and the admin photo
-- browser lists shadow-hidden polaroids newest-first.
CREATE INDEX IF NOT EXISTS idx_social_posts_shadow_hidden
  ON social_posts (post_id)
  WHERE is_shadow_hidden = true;

COMMIT;
