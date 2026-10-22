-- PALTU-31 follow-up: per-view engagement and signed-in attribution for page_events.
--   view_id      groups a page_view with the scroll_depth / page_leave / cta_click events
--                that happened during it (time on page, scroll depth per view)
--   user_id      the signed-in user, when there is one (no other PII is stored)
--   city         coarse city from the hosting edge's IP geolocation (x-vercel-ip-city)
--   scroll_depth 25 / 50 / 75 / 100 on scroll_depth events
--   duration_ms  visible time on the page, sent in slices on page_leave events

BEGIN;

ALTER TABLE page_events
  ADD COLUMN IF NOT EXISTS view_id UUID,
  ADD COLUMN IF NOT EXISTS user_id INTEGER,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS scroll_depth SMALLINT CHECK (scroll_depth IN (25, 50, 75, 100)),
  ADD COLUMN IF NOT EXISTS duration_ms INTEGER CHECK (duration_ms > 0);

ALTER TABLE page_events DROP CONSTRAINT IF EXISTS page_events_event_type_check;
ALTER TABLE page_events ADD CONSTRAINT page_events_event_type_check
  CHECK (event_type IN ('page_view', 'page_leave', 'scroll_depth', 'cta_click', 'ad_impression', 'ad_click'));

CREATE INDEX IF NOT EXISTS idx_page_events_view ON page_events(view_id) WHERE view_id IS NOT NULL;

COMMIT;
