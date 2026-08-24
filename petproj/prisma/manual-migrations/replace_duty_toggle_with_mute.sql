-- Dispatchers can no longer manually go "off duty" — they're always alertable during
-- operating hours (12pm-12am PKT, enforced in app code, see requests/route.ts). The only
-- control they get is muting alerts for a fixed 30 minutes. Replaces the is_on_duty boolean
-- toggle with a muted_until timestamp. Already applied directly to the live database.

ALTER TABLE express_vet_dispatcher_status
  ADD COLUMN IF NOT EXISTS muted_until TIMESTAMPTZ;

ALTER TABLE express_vet_dispatcher_status
  DROP COLUMN IF EXISTS is_on_duty;
