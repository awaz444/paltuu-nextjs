-- ============================================================
-- Migration 006: Add Social Mentions
-- Index table for @mentions found inside social_posts/social_comments
-- content. NOT used for rendering — content already carries the
-- self-describing bracket token (e.g. @[alice_w](user:7)), frozen at
-- mention-time. This table exists for notification fan-out and
-- "posts I'm mentioned in" lookups.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS social_mentions (
    mention_id          BIGSERIAL PRIMARY KEY,
    post_id             BIGINT  REFERENCES social_posts(post_id) ON DELETE CASCADE,
    comment_id          BIGINT  REFERENCES social_comments(comment_id) ON DELETE CASCADE,
    mentioned_user_id   INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    mentioned_pet_id    INTEGER REFERENCES pet_profiles(pet_profile_id) ON DELETE CASCADE,
    mentioned_by        INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Exactly one of {mentioned_user_id, mentioned_pet_id} must be set —
    -- a mention targets a user OR a pet profile, never both, never neither.
    CONSTRAINT chk_social_mentions_exactly_one_target CHECK (
        (mentioned_user_id IS NOT NULL)::int + (mentioned_pet_id IS NOT NULL)::int = 1
    ),

    -- Exactly one of {post_id, comment_id} must be set — a mention belongs
    -- to a post OR a comment/reply, never both, never neither.
    CONSTRAINT chk_social_mentions_exactly_one_parent CHECK (
        (post_id IS NOT NULL)::int + (comment_id IS NOT NULL)::int = 1
    )
);

CREATE INDEX IF NOT EXISTS idx_social_mentions_post_id
    ON social_mentions(post_id);

CREATE INDEX IF NOT EXISTS idx_social_mentions_comment_id
    ON social_mentions(comment_id);

CREATE INDEX IF NOT EXISTS idx_social_mentions_user
    ON social_mentions(mentioned_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_mentions_pet
    ON social_mentions(mentioned_pet_id);

CREATE INDEX IF NOT EXISTS idx_social_mentions_by
    ON social_mentions(mentioned_by);

-- Duplicate-mention backstop (parseMentions() already de-dupes in JS before
-- insert — these partial unique indexes exist so a future bug fails loudly
-- via ON CONFLICT DO NOTHING instead of silently inserting duplicate rows).
CREATE UNIQUE INDEX IF NOT EXISTS uq_social_mentions_post_user
    ON social_mentions(post_id, mentioned_user_id) WHERE post_id IS NOT NULL AND mentioned_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_social_mentions_post_pet
    ON social_mentions(post_id, mentioned_pet_id) WHERE post_id IS NOT NULL AND mentioned_pet_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_social_mentions_comment_user
    ON social_mentions(comment_id, mentioned_user_id) WHERE comment_id IS NOT NULL AND mentioned_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_social_mentions_comment_pet
    ON social_mentions(comment_id, mentioned_pet_id) WHERE comment_id IS NOT NULL AND mentioned_pet_id IS NOT NULL;

COMMIT;
