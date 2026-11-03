-- PALTU-102: keep older adoption listings visible.
--
-- bumped_at                   Set when the owner confirms the pet is still available
--                             (or relists a paused listing). Feed ranking uses
--                             COALESCE(bumped_at, created_at), so a confirmed listing
--                             re-enters the "fresh" tier. created_at stays untouched
--                             and still drives the "Waiting N days" badge.
-- availability_check_sent_at  When the "Is <pet> still available?" reminder went out.
--                             NULL = no check pending. If the owner doesn't answer
--                             within the grace period the listing is paused.
-- availability_email_sent_at  When that reminder also went out by email (owners with
--                             no app push token). Used to enforce the daily email cap
--                             so reminders can't exhaust the Mailjet/Brevo free quota.
--
-- Paused listings use adoption_status = 'paused'. Every public feed already filters
-- on adoption_status = 'available', so they drop out without further query changes.
ALTER TABLE pets
    ADD COLUMN IF NOT EXISTS bumped_at TIMESTAMP(6),
    ADD COLUMN IF NOT EXISTS availability_check_sent_at TIMESTAMP(6),
    ADD COLUMN IF NOT EXISTS availability_email_sent_at TIMESTAMP(6);

-- The reminder sweep scans available listings by how long they've been live.
CREATE INDEX IF NOT EXISTS idx_pets_availability_sweep
    ON pets ((COALESCE(bumped_at, created_at)))
    WHERE adoption_status = 'available' AND approved = true;
