-- Adds ringing-call push token storage to express_vet_dispatcher_status.
-- Matches the schema.prisma change for the Vets at Home dispatcher CallKit alert.
-- Run this against the real database (not included in an automated `prisma migrate
-- dev` run here since that needs a live DB connection this environment doesn't have) —
-- then run `npx prisma generate` if the Prisma Client needs regenerating.

ALTER TABLE express_vet_dispatcher_status
  ADD COLUMN IF NOT EXISTS push_platform   VARCHAR(10),
  ADD COLUMN IF NOT EXISTS voip_push_token TEXT,
  ADD COLUMN IF NOT EXISTS fcm_push_token  TEXT;
