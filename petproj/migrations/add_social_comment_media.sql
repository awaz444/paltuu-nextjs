-- Migration: add media support to social_comments (mirrors social_post_media)
-- Run this in your PostgreSQL DB (e.g. via psql or your DB client)

CREATE TABLE IF NOT EXISTS social_comment_media (
    media_id      BIGSERIAL PRIMARY KEY,
    comment_id    BIGINT NOT NULL REFERENCES social_comments(comment_id) ON DELETE CASCADE,
    media_type    TEXT NOT NULL,
    url           TEXT NOT NULL,
    thumbnail_url TEXT,
    ordering      INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_social_comment_media_comment_id
    ON social_comment_media (comment_id);
