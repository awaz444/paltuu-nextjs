-- Add coordinates to clinics table
-- Adds separate latitude and longitude columns for precise geo-location support

BEGIN;

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS latitude  DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Optional: index for basic bounding-box queries
-- (e.g. WHERE latitude BETWEEN x1 AND x2 AND longitude BETWEEN y1 AND y2)
CREATE INDEX IF NOT EXISTS idx_clinics_latitude  ON clinics (latitude);
CREATE INDEX IF NOT EXISTS idx_clinics_longitude ON clinics (longitude);

COMMIT;
