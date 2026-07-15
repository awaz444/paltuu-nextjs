-- Create notification_campaigns table for admin-triggered broadcast notifications
-- Audit/history table for the admin panel's "send notification to all users" feature

BEGIN;

CREATE TABLE IF NOT EXISTS notification_campaigns (
  campaign_id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  deep_link VARCHAR(500),
  image_url VARCHAR(500),
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  push_success_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'sent', 'failed', 'partial')),
  error_message TEXT,
  sent_by INTEGER NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notification_campaigns_created_at ON notification_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_sent_by ON notification_campaigns(sent_by);

COMMIT;
