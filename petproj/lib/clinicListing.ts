import { db } from "@/db/index";

let ready: boolean | null = null;
let inflight: Promise<boolean> | null = null;

/**
 * Adds listing_type / coverage_area if missing, and one-time-seeds Dr Moiz
 * as a home vet. Returns whether those columns currently exist so callers
 * can skip listing_type SQL when they don't.
 */
export function ensureClinicListingColumns(): Promise<boolean> {
    if (ready !== null) return Promise.resolve(ready);
    if (inflight) return inflight;

    inflight = (async () => {
        try {
            await db.query(`
                ALTER TABLE clinics
                  ADD COLUMN IF NOT EXISTS listing_type VARCHAR(20) NOT NULL DEFAULT 'clinic',
                  ADD COLUMN IF NOT EXISTS coverage_area TEXT
            `);
        } catch (err) {
            console.error("ensureClinicListingColumns ALTER:", err);
            try {
                const check = await db.query(`
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'clinics'
                      AND column_name = 'listing_type'
                    LIMIT 1
                `);
                if ((check.rowCount ?? 0) === 0) {
                    ready = null;
                    return false;
                }
            } catch {
                ready = null;
                return false;
            }
        }

        try {
            await db.query(`
                UPDATE clinics
                SET
                    listing_type = 'home_vet',
                    name = 'Dr Moiz Home Vet Services',
                    coverage_area = 'All over Karachi',
                    address = '',
                    discount_details = '20% Discount on All Services',
                    is_paltuu_partner = true
                WHERE (clinic_id = 496 OR name ILIKE '%moiz%')
                  AND (listing_type IS DISTINCT FROM 'home_vet' OR coverage_area IS NULL)
            `);
        } catch (err) {
            console.error("ensureClinicListingColumns seed:", err);
        }

        ready = true;
        return true;
    })().finally(() => {
        inflight = null;
    });

    return inflight;
}
