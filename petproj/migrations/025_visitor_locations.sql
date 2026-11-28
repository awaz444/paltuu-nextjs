-- PALTU-192 (revised): visitor geography comes from the browser location a visitor
-- chooses to share (asked once on their first visit, or when they tap "Use my
-- location" / "Near me"), not from IP geolocation.
--   visitor_locations  one row per session that shared a location. Only the place
--                      names worked out from it are stored, never coordinates.
-- Replaces visitor_areas from 024 (Karachi taps only, live for a few hours).
-- page_events.city / country / region are no longer written; old rows keep theirs.

BEGIN;

CREATE TABLE IF NOT EXISTS visitor_locations (
  id BIGSERIAL PRIMARY KEY,
  visitor_id UUID,
  session_id UUID,
  user_id INTEGER,
  source VARCHAR(20) NOT NULL CHECK (source IN ('arrival', 'clinics', 'pet_care')),
  country VARCHAR(20) NOT NULL CHECK (country IN ('Pakistan', 'Outside Pakistan')),
  province VARCHAR(50),
  city VARCHAR(100),
  district VARCHAR(50),
  area VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_visitor_locations_created ON visitor_locations(created_at);
CREATE INDEX IF NOT EXISTS idx_visitor_locations_session ON visitor_locations(session_id) WHERE session_id IS NOT NULL;

INSERT INTO visitor_locations (visitor_id, session_id, user_id, source, country, province, city, district, area, created_at)
SELECT visitor_id, session_id, user_id, 'clinics', 'Pakistan', 'Sindh', city, district, area, created_at
FROM visitor_areas;

DROP TABLE IF EXISTS visitor_areas;

COMMIT;
