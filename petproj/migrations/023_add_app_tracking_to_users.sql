-- Migration 023: Add app tracking columns to users (PALTU-57)
-- Enables reliable app adoption tracking even if notifications are denied or tokens cleaned up.

BEGIN;

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS app_platform VARCHAR(20),
  ADD COLUMN IF NOT EXISTS last_app_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signup_source VARCHAR(20) DEFAULT 'web';

-- Backfill app_platform & last_app_seen_at from existing user_devices
WITH dev_agg AS (
  SELECT 
    user_id,
    device_platform,
    MAX(COALESCE(last_used, created_at)) as max_last_seen,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY MAX(COALESCE(last_used, created_at)) DESC) as rn
  FROM user_devices
  GROUP BY user_id, device_platform
)
UPDATE users u
SET 
  app_platform = d.device_platform,
  last_app_seen_at = d.max_last_seen
FROM dev_agg d
WHERE u.user_id = d.user_id AND d.rn = 1;

-- Backfill signup_source for users whose first device was created within 48h of account registration
WITH dev_first AS (
  SELECT user_id, MIN(created_at) as first_device_at
  FROM user_devices
  GROUP BY user_id
)
UPDATE users u
SET signup_source = 'app'
FROM dev_first d
WHERE u.user_id = d.user_id
  AND (
    d.first_device_at <= u.created_at + INTERVAL '48 hours'
  );

CREATE INDEX IF NOT EXISTS idx_users_app_platform ON users(app_platform);
CREATE INDEX IF NOT EXISTS idx_users_last_app_seen ON users(last_app_seen_at);
CREATE INDEX IF NOT EXISTS idx_users_signup_source ON users(signup_source);

COMMIT;
