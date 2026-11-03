import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { AdoptionNotifications } from "@/lib/notifications";
import { sendListingAvailabilityCheckEmail } from "@/utils/mailjet";
import { AVAILABILITY_CHECK_AFTER_DAYS, AVAILABILITY_GRACE_DAYS } from "@/lib/adoptionFeed";

export const dynamic = "force-dynamic";

// Rolling 24h caps. Push is free (FCM/Expo); email shares the Brevo free-tier
// daily quota with order/application emails, so it gets a much tighter cap.
const DAILY_REMINDER_CAP = 500;
const DAILY_EMAIL_CAP = 100;
// Per-run batch so one sweep stays well inside the caller's timeout.
const BATCH_SIZE = 50;

type Candidate = {
    pet_id: number;
    owner_id: number;
    pet_name: string;
    owner_name: string | null;
    owner_email: string | null;
    has_push: boolean;
    image_url: string | null;
};

/**
 * @swagger
 * /api/v1/pets/cron/availability-check:
 *   post:
 *     summary: Pause unanswered adoption listings and send "still available?" reminders (V1, internal)
 *     tags: [v1 Pets]
 */
export async function POST(req: NextRequest) {
    const internalKey = req.headers.get("x-internal-key");
    if (!process.env.REALTIME_INTERNAL_KEY || internalKey !== process.env.REALTIME_INTERNAL_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Pause listings whose owner never answered the check.
        const paused = await db.query(
            `UPDATE pets
             SET adoption_status = 'paused'
             WHERE adoption_status = 'available'
               AND availability_check_sent_at IS NOT NULL
               AND availability_check_sent_at < now() - ($1 || ' days')::interval
             RETURNING pet_id, owner_id, pet_name,
                       (SELECT image_url FROM pet_images WHERE pet_id = pets.pet_id ORDER BY "order" ASC LIMIT 1) AS image_url`,
            [AVAILABILITY_GRACE_DAYS]
        );
        await Promise.allSettled(
            paused.rows
                .filter((r: any) => r.owner_id)
                .map((r: any) => AdoptionNotifications.onListingPaused(r.owner_id, r.pet_id, r.pet_name, r.image_url ?? undefined))
        );

        // 2. Send new reminders within today's budgets.
        const budgets = await db.query(
            `SELECT
                COUNT(*) FILTER (WHERE availability_check_sent_at > now() - interval '24 hours') AS reminders,
                COUNT(*) FILTER (WHERE availability_email_sent_at > now() - interval '24 hours') AS emails
             FROM pets
             WHERE availability_check_sent_at > now() - interval '24 hours'`
        );
        const reminderBudget = Math.max(0, DAILY_REMINDER_CAP - parseInt(budgets.rows[0].reminders, 10));
        let emailBudget = Math.max(0, DAILY_EMAIL_CAP - parseInt(budgets.rows[0].emails, 10));

        let reminded = 0;
        let emailed = 0;

        const limit = Math.min(BATCH_SIZE, reminderBudget);
        if (limit > 0) {
            // Only pick owners we can actually reach — otherwise their listing
            // would be paused without them ever seeing the question.
            const candidates = await db.query(
                `SELECT p.pet_id, p.owner_id, p.pet_name,
                        u.name AS owner_name, u.email AS owner_email,
                        EXISTS (SELECT 1 FROM user_devices d WHERE d.user_id = p.owner_id) AS has_push,
                        (SELECT image_url FROM pet_images WHERE pet_id = p.pet_id ORDER BY "order" ASC LIMIT 1) AS image_url
                 FROM pets p
                 JOIN users u ON u.user_id = p.owner_id
                 WHERE p.adoption_status = 'available'
                   AND p.approved = true
                   AND p.availability_check_sent_at IS NULL
                   AND COALESCE(p.bumped_at, p.created_at) < now() - ($1 || ' days')::interval
                   AND (
                        EXISTS (SELECT 1 FROM user_devices d WHERE d.user_id = p.owner_id)
                        OR (u.email IS NOT NULL AND u.email <> '' AND $2::int > 0)
                   )
                 ORDER BY COALESCE(p.bumped_at, p.created_at) ASC
                 LIMIT $3`,
                [AVAILABILITY_CHECK_AFTER_DAYS, emailBudget, limit]
            );

            for (const c of candidates.rows as Candidate[]) {
                const useEmail = !c.has_push;
                if (useEmail && emailBudget <= 0) continue;

                // Claim the row so an overlapping sweep can't double-send.
                const claim = await db.query(
                    `UPDATE pets SET availability_check_sent_at = now()
                     WHERE pet_id = $1 AND availability_check_sent_at IS NULL
                     RETURNING pet_id`,
                    [c.pet_id]
                );
                if (claim.rowCount === 0) continue;

                if (useEmail) {
                    emailBudget--;
                    try {
                        await sendListingAvailabilityCheckEmail({
                            to: c.owner_email!,
                            owner_name: c.owner_name,
                            pet_name: c.pet_name,
                            grace_days: AVAILABILITY_GRACE_DAYS,
                        });
                        await db.query(`UPDATE pets SET availability_email_sent_at = now() WHERE pet_id = $1`, [c.pet_id]);
                        emailed++;
                    } catch (err) {
                        // Undo the claim: never start the pause clock on a reminder that didn't go out.
                        console.error(`availability-check: email failed for pet ${c.pet_id}:`, err);
                        await db.query(`UPDATE pets SET availability_check_sent_at = NULL WHERE pet_id = $1`, [c.pet_id]);
                        continue;
                    }
                }

                // In-app notification for everyone; also delivers the push when a device exists.
                await AdoptionNotifications.onAvailabilityCheck(c.owner_id, c.pet_id, c.pet_name, c.image_url ?? undefined).catch(
                    (err) => console.error(`availability-check: notification failed for pet ${c.pet_id}:`, err)
                );
                reminded++;
            }
        }

        return NextResponse.json({ paused_count: paused.rowCount ?? 0, reminded_count: reminded, emailed_count: emailed });
    } catch (error) {
        console.error("pets cron/availability-check POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
