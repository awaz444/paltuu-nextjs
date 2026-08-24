-- Adds dispatcher-set visit scheduling and an optional client-supplied Google Maps link
-- to express_vet_requests. Both nullable, additive, no backfill needed.
-- Already applied directly to the live database; this file documents the change and lets
-- other environments (staging, local dev) catch up.

ALTER TABLE express_vet_requests
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS maps_link TEXT;
