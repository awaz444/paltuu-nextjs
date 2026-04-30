-- Step 1: Create user_devices table for Firebase tokens
CREATE TABLE IF NOT EXISTS "user_devices" (
  "device_id" BIGSERIAL NOT NULL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "fcm_token" VARCHAR(255) NOT NULL UNIQUE,
  "device_platform" VARCHAR(20),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Step 2: Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS "idx_user_devices_user_id" ON "user_devices"("user_id");

-- Step 3: Clean up orphaned notification records (user_id doesn't exist in users table)
DELETE FROM "notifications" WHERE "user_id" IS NOT NULL AND "user_id" NOT IN (SELECT "user_id" FROM "users");

-- Step 4: Drop old columns from notifications table
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "notification_type";
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "notification_content";
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "date_sent";

-- Step 5: Add new columns to notifications table with defaults
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "sender_id" INTEGER;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "title" VARCHAR(255) NOT NULL DEFAULT 'Notification';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "body" TEXT NOT NULL DEFAULT '';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "type" VARCHAR(50) NOT NULL DEFAULT 'SYSTEM';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "deep_link" VARCHAR(255);
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "image_url" VARCHAR(255);
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 6: Drop old entity_type constraint if exists and recreate with new type
ALTER TABLE "notifications" ALTER COLUMN "entity_type" TYPE VARCHAR(50);

-- Step 7: Change is_read to NOT NULL with default
ALTER TABLE "notifications" ALTER COLUMN "is_read" SET NOT NULL;
ALTER TABLE "notifications" ALTER COLUMN "is_read" SET DEFAULT false;

-- Step 8: Drop existing foreign keys on notifications
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_fkey";

-- Step 9: Add new foreign keys with proper cascade
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Step 10: Create indexes for performance
DROP INDEX IF EXISTS "idx_notifications_created";
DROP INDEX IF EXISTS "idx_notifications_user_read";

CREATE INDEX "idx_notifications_user_read" ON "notifications"("user_id", "is_read");
CREATE INDEX "idx_notifications_created" ON "notifications"("created_at" DESC);
