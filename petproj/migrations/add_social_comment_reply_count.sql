-- Denormalized reply counter, mirrors like_count (add_social_comment_likes.sql).
-- Counts DIRECT children only (immediate replies to that comment), same
-- "one signal per comment" semantics as like_count — not a full descendant
-- subtree count.
ALTER TABLE social_comments
    ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- Backfill for existing rows.
UPDATE social_comments c
SET reply_count = sub.cnt
FROM (
    SELECT parent_comment_id, COUNT(*) AS cnt
    FROM social_comments
    WHERE parent_comment_id IS NOT NULL AND is_deleted = false
    GROUP BY parent_comment_id
) sub
WHERE c.comment_id = sub.parent_comment_id;

CREATE INDEX IF NOT EXISTS idx_social_comments_score_lookup
    ON social_comments (post_id, is_deleted)
    WHERE is_deleted = false;
