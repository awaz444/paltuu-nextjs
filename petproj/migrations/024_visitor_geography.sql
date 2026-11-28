-- PALTU-192: where visitors come from, for the admin traffic dashboard.
--   page_events.country  ISO country code from the hosting edge's IP geolocation (x-vercel-ip-country)
--   page_events.region   province / state from the same source (x-vercel-ip-country-region),
--                        stored as a name for Pakistan ("Sindh") and as the raw code elsewhere
--   visitor_areas        the Karachi area a visitor was in when they chose to share their
--                        location ("Use my location", "Near me"). Only the area and district
--                        names are stored, never coordinates.

BEGIN;

ALTER TABLE page_events
  ADD COLUMN IF NOT EXISTS country CHAR(2),
  ADD COLUMN IF NOT EXISTS region VARCHAR(100);

CREATE TABLE IF NOT EXISTS visitor_areas (
  id BIGSERIAL PRIMARY KEY,
  visitor_id UUID,
  session_id UUID,
  user_id INTEGER,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(50) NOT NULL,
  area VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_visitor_areas_created ON visitor_areas(created_at);

COMMIT;
