-- Create beta_signups table for mobile app beta program waitlist
-- Captures platform preference (ios/android) and email so we can grant TestFlight/Play beta access

BEGIN;

CREATE TABLE IF NOT EXISTS beta_signups (
  beta_signup_id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'granted')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_beta_signups_platform ON beta_signups(platform);
CREATE INDEX IF NOT EXISTS idx_beta_signups_status ON beta_signups(status);

COMMIT;
