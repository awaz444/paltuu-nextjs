-- Split pet-care listings into clinics vs home-visit vets.
-- listing_type: 'clinic' (default) | 'home_vet'
-- coverage_area: neighbourhoods a home vet visits (shown instead of a street address)
--
-- Dr Moiz (clinic_id 496) is the first home vet.

BEGIN;

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS listing_type VARCHAR(20) NOT NULL DEFAULT 'clinic',
  ADD COLUMN IF NOT EXISTS coverage_area TEXT;

UPDATE clinics
SET listing_type = 'home_vet'
WHERE clinic_id = 496 OR name ILIKE '%moiz%';

COMMIT;
