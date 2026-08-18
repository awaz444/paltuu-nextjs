-- Archive rows when users delete posts/comments — powers Activity > Recently Deleted.

BEGIN;

CREATE TABLE IF NOT EXISTS deleted_social_posts (
  deleted_post_id BIGSERIAL PRIMARY KEY,
  post_id           BIGINT NOT NULL,
  user_id           INT NOT NULL,
  content           TEXT,
  thumbnail_url     TEXT,
  deleted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deleted_social_comments (
  deleted_comment_id BIGSERIAL PRIMARY KEY,
  comment_id         BIGINT NOT NULL,
  post_id            BIGINT NOT NULL,
  user_id            INT NOT NULL,
  content            TEXT,
  thumbnail_url      TEXT,
  deleted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deleted_social_posts_user_deleted
  ON deleted_social_posts (user_id, deleted_at DESC);

CREATE INDEX IF NOT EXISTS idx_deleted_social_comments_user_deleted
  ON deleted_social_comments (user_id, deleted_at DESC);

COMMIT;
