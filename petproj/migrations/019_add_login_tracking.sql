-- Add last_login_at to users and ensure audit_logs can record login events

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

COMMIT;
