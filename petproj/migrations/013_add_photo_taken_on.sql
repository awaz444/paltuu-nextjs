-- ============================================================
-- Migration 013: Optional "taken on" date for pet gallery polaroids
--
-- Owners can tag a polaroid with the day it was taken, shown as a small chip
-- on the print. Entirely optional — NULL means "no date", which is what every
-- existing photo gets, and the chip simply isn't rendered.
--
-- DATE, not TIMESTAMP: this is a calendar day the owner types in, not an
-- instant. Storing it as a timestamp would drag the viewer's timezone into
-- it and could shift the displayed day by one either side of midnight.
--
-- Deliberately NOT reusing created_at: that's when the photo was UPLOADED.
-- The whole point of this field is that a polaroid of a puppy's first day
-- home can be uploaded years later and still read as that day.
--
-- No CHECK constraint on the upper bound (future dates): the API layer
-- rejects those, and a constraint here would make the harmless case of a
-- device with a skewed clock fail as a 500 rather than a 400.
-- ============================================================

BEGIN;

ALTER TABLE pet_profile_photos
  ADD COLUMN IF NOT EXISTS taken_on DATE;

COMMIT;
