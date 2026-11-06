/**
 * Queue a WhatsApp message for the Paltuu team.
 *
 * This app runs on Vercel and the WhatsApp socket runs on the bots box, so they
 * cannot call each other, but they share this database. We INSERT a row into
 * bots.wa_outbox and the bot picks it up. Nothing new is exposed, and a
 * notification survives the bot being offline.
 *
 * Only says WHAT happened. The wording lives in the bot's templates
 * (paltuu-bots-infra apps/whatsapp-bot/src/notifications/templates.ts), and who
 * receives each kind lives in bots.settings `whatsapp.team_numbers`.
 *
 * Calls never throw: a notification that cannot be queued must never fail the
 * request that triggered it. They are awaited rather than fired and forgotten,
 * because Vercel may freeze the function as soon as the response is sent. One
 * INSERT is cheap.
 */

import { db } from "@/db/index";
import { EXPRESS_VET_CATEGORY_LABELS } from "@/lib/expressVet/catalog";

export type TeamNotificationKind =
    | "team_listing_pending"
    | "team_listing_decided"
    | "team_listing_closed"
    | "team_application_submitted"
    | "team_application_decided"
    | "team_vet_request"
    | "team_vet_request_update"
    | "team_lost_found"
    | "team_signup";

/**
 * @param dedupeKey One per real-world event. A retry of the same request with
 *   the same key is dropped by the outbox, so nobody is messaged twice.
 */
export async function notifyTeam(
    kind: TeamNotificationKind,
    params: Record<string, unknown>,
    dedupeKey: string,
): Promise<void> {
    try {
        await db.query(
            `INSERT INTO bots.wa_outbox (to_number, kind, audience, params, dedupe_key)
             VALUES ('', $1, 'team', $2::jsonb, $3)
             ON CONFLICT (dedupe_key) DO NOTHING`,
            [kind, JSON.stringify(params), dedupeKey],
        );
    } catch (err) {
        console.error(`[whatsappNotify] could not queue ${kind}:`, err);
    }
}

/** New listing, with the details the template wants and the approval backlog. */
export async function notifyNewListing(petId: number): Promise<void> {
    try {
        const { rows } = await db.query(
            `SELECT p.pet_id, p.pet_name, c.city_name AS city, u.name AS owner_name,
                    (SELECT count(*)::int FROM pets WHERE approved = false AND adoption_status = 'available') AS pending_count
               FROM pets p
               JOIN users u ON u.user_id = p.owner_id
               LEFT JOIN cities c ON c.city_id = p.city_id
              WHERE p.pet_id = $1`,
            [petId],
        );
        if (!rows[0]) return;
        await notifyTeam("team_listing_pending", rows[0], `listing:${petId}:created`);
    } catch (err) {
        console.error("[whatsappNotify] new listing lookup failed:", err);
    }
}

export type VetRequestStatus = "claimed" | "assigned" | "released" | "completed" | "cancelled" | "expired";

/** A Vets at Home request moved on. Claim and release can repeat, so each is its own event. */
export async function notifyVetRequestUpdate(
    request: { request_id: number | string; category?: string | null },
    status: VetRequestStatus,
    vetName?: string | null,
): Promise<void> {
    const category = request.category ? EXPRESS_VET_CATEGORY_LABELS[request.category] ?? request.category : null;
    await notifyTeam(
        "team_vet_request_update",
        { request_id: request.request_id, status, category, vet_name: vetName ?? null },
        `vet_request:${request.request_id}:${status}:${Date.now()}`,
    );
}

const SIGNUP_METHOD_LABELS: Record<string, string> = { email: "email", google: "Google", apple: "Apple" };

/** New account, with how they signed up and the running count for today (Pakistan time). */
export async function notifySignup(userId: number | string, method: string): Promise<void> {
    try {
        const { rows } = await db.query(
            `SELECT name,
                    (SELECT count(*)::int FROM users
                      WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Karachi') AT TIME ZONE 'Asia/Karachi') AS total_today
               FROM users WHERE user_id = $1`,
            [userId],
        );
        if (!rows[0]) return;
        await notifyTeam(
            "team_signup",
            { name: rows[0].name, method: SIGNUP_METHOD_LABELS[method] ?? method, total_today: rows[0].total_today },
            `signup:${userId}`,
        );
    } catch (err) {
        console.error("[whatsappNotify] signup lookup failed:", err);
    }
}

/** Name of the user who did something, for "by Hamza" in the message. */
export async function userName(userId: number | string | null | undefined): Promise<string | null> {
    if (!userId) return null;
    try {
        const { rows } = await db.query(`SELECT name FROM users WHERE user_id = $1`, [userId]);
        return rows[0]?.name ?? null;
    } catch {
        return null;
    }
}
