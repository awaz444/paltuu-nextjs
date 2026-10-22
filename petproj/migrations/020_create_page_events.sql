-- First-party traffic tracking: page views, CTA clicks, and brand ad slot
-- impressions/clicks from the public website. Feeds the admin traffic dashboard.
-- No IP address or user agent is stored; visitor_id is a random id kept in the
-- browser's localStorage (absent when the visitor rejected cookies).

BEGIN;

CREATE TABLE IF NOT EXISTS page_events (
  event_id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('page_view', 'cta_click', 'ad_impression', 'ad_click')),
  path VARCHAR(500) NOT NULL,
  page_type VARCHAR(50) NOT NULL,
  cta VARCHAR(100),
  ad_slot VARCHAR(100),
  target VARCHAR(500),
  referrer_host VARCHAR(255),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  visitor_id UUID,
  session_id UUID,
  device VARCHAR(10) CHECK (device IN ('mobile', 'tablet', 'desktop')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_page_events_type_created ON page_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_page_events_created ON page_events(created_at);

COMMIT;
