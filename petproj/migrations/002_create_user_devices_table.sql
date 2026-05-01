-- Create user_devices table for FCM token management
-- Stores Firebase Cloud Messaging tokens for push notifications

BEGIN;

-- Create user_devices table
CREATE TABLE IF NOT EXISTS user_devices (
  device_id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  fcm_token VARCHAR(500) NOT NULL UNIQUE,
  device_platform VARCHAR(50) NOT NULL CHECK (device_platform IN ('android', 'ios', 'web')),
  device_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_fcm_token ON user_devices(fcm_token);
CREATE INDEX IF NOT EXISTS idx_user_devices_is_active ON user_devices(is_active);

COMMIT;
