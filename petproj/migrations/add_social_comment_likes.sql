-- Migration: add like support to social_comments (mirrors social_likes/social_posts.like_count)
-- Run this in your PostgreSQL DB (e.g. via psql or your DB client)

ALTER TABLE social_comments
    ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS social_comment_likes (
    like_id     BIGSERIAL PRIMARY KEY,
    comment_id  BIGINT NOT NULL REFERENCES social_comments(comment_id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_social_comment_likes_comment_id
    ON social_comment_likes (comment_id);

CREATE INDEX IF NOT EXISTS idx_social_comment_likes_user_id
    ON social_comment_likes (user_id);
