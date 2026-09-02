-- ============================================================
-- Migration 018: Admin "trigger warning" flag for social posts
--
-- `has_trigger_warning = true` means the post stays fully visible in every
-- feed and on the profile grid, but the mobile client renders its media
-- blurred behind a "See Post" reveal (see PostCard's MediaBlock /
-- TriggerWarningOverlay). This is Paltuu putting a content screen in front
-- of potentially distressing imagery, not a hide — the post, its caption
-- and its engagement are untouched.
--
-- ADMIN-ONLY, and manual: unlike content_notice_reason = 'pet_sale' there is
-- no detector. It is set from the Post Browser and the Reports queue via the
-- moderate endpoint (PATCH .../moderate  { trigger_warning: true | false }),
-- exactly mirroring the pet-sale flag control next to it.
--
-- Deliberately a NEW boolean column rather than another value on
-- content_notice_reason:
--   content_notice_reason = 'pet_sale' -> public "buying/selling" banner
--   has_trigger_warning                -> media blur + reveal
-- The treatments are different and a single post can carry both, so a
-- one-slot reason string can't represent them together.
--
-- Default is false, so every existing row stays exactly as it is.
-- ============================================================

BEGIN;

ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS has_trigger_warning BOOLEAN NOT NULL DEFAULT false;

-- The admin Post Browser / Reports queue filter on this flag directly.
CREATE INDEX IF NOT EXISTS idx_social_posts_trigger_warning
  ON social_posts (post_id)
  WHERE has_trigger_warning = true;

COMMIT;
