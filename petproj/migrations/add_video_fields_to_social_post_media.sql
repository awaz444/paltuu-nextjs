-- Migration: add video transcoding fields to social_post_media
-- Run this in your PostgreSQL DB (e.g. via psql or your DB client)

-- 1. Add video pipeline columns to social_post_media
ALTER TABLE social_post_media
    ADD COLUMN IF NOT EXISTS video_status         TEXT    DEFAULT 'ready'
                                                          CHECK (video_status IN ('pending','processing','ready','failed')),
    ADD COLUMN IF NOT EXISTS hls_url              TEXT,
    ADD COLUMN IF NOT EXISTS video_key            TEXT,
    ADD COLUMN IF NOT EXISTS mediaconvert_job_id  TEXT,
    ADD COLUMN IF NOT EXISTS duration_seconds     INTEGER;

-- 2. For existing image rows, keep them as 'ready' (default above handles new rows)
-- For existing video rows that were uploaded via the old /social/upload route:
UPDATE social_post_media
SET video_status = 'ready'
WHERE media_type = 'video' AND video_status IS NULL;

-- 3. Index for webhook lookups by job ID
CREATE INDEX IF NOT EXISTS idx_social_post_media_job_id
    ON social_post_media (mediaconvert_job_id);

-- 4. Index for polling by status
CREATE INDEX IF NOT EXISTS idx_social_post_media_video_status
    ON social_post_media (video_status)
    WHERE media_type = 'video';
