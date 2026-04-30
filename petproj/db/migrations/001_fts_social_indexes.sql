-- ============================================================
-- Phase 1B: Full-Text Search (FTS) GIN Indexes — Social & Users
-- Run once against AWS RDS paltuudb
-- ============================================================

-- 1. Users: search by name and handle
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search
  ON users
  USING gin(to_tsvector('english', name || ' ' || coalesce(social_username, '')));

-- 2. Social Posts: search by caption content
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_content_fts
  ON social_posts
  USING gin(to_tsvector('english', coalesce(content, '')));

-- 3. Social Comments: search by comment text
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_content_fts
  ON social_comments
  USING gin(to_tsvector('english', content));

-- 4. Social Reposts: search by repost caption
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reposts_caption_fts
  ON social_reposts
  USING gin(to_tsvector('english', coalesce(caption, '')));

-- 5. Hashtags: prefix search (LIKE 'cats%') + trending sort
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hashtags_tag
  ON hashtags(tag varchar_pattern_ops);

-- (trending index is already created via Prisma schema @@index on post_count DESC)
