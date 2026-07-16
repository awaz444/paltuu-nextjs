-- Add target_comment_id so comment/reply notifications can deep-link to the
-- specific comment/reply instead of just the parent post.

BEGIN;

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS target_comment_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_notifications_target_comment_id ON notifications(target_comment_id);

COMMIT;
