-- ============================================================
-- Migration 015: Pet-sale flag becomes a PUBLIC notice, not a shadow-hide
--
-- Product change: posts flagged for selling a pet are no longer
-- shadow-hidden. They stay visible to everyone exactly like a normal post,
-- with an "i" notice badge shown to EVERY viewer (not just the author) —
-- see lib/moderation/petSaleDetection.ts and PostCard's MediaBlock on the
-- client. This is the opposite visibility model from migration 011's
-- shadow-hide, so the column is renamed to stop implying otherwise, and
-- reused for content_notice_reason generally (currently only 'pet_sale').
--
-- Un-hides any post that got auto shadow-hidden under the old (011..014)
-- behavior, restoring it to normal visibility while keeping the reason so
-- the new public badge still shows.
-- ============================================================

BEGIN;

ALTER TABLE social_posts
  RENAME COLUMN shadow_hide_reason TO content_notice_reason;

UPDATE social_posts
   SET is_shadow_hidden = false,
       moderation_state = 'none'
 WHERE content_notice_reason = 'pet_sale'
   AND is_shadow_hidden = true;

COMMIT;
