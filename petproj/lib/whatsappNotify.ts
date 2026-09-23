/**
 * Queue a WhatsApp notification.
 *
 * This app runs on Vercel and the WhatsApp socket runs on the bots box, so they
 * cannot call each other - but they share this database. We INSERT a row and
 * the bot picks it up. Nothing new is exposed, and a notification survives the
 * bot being offline.
 *
 * The phone number is supplied here, so the bots service never needs read
 * access to users.phone_number.
 *
 * Every call is fire-and-forget and swallows its own errors: a notification
 * that cannot be queued must never fail the request that triggered it. Someone
 * listing a pet should not see an error because a WhatsApp message could not be
 * scheduled.
 *
 * Nothing sends until the bots side is switched on (bots.settings
 * whatsapp.team_notifications / whatsapp.customer_notifications). Queuing is
 * always safe.
 */

import { db } from "@/db/index";

export type WhatsAppNotificationKind =
  | "listing_submitted"
  | "listing_approved"
  | "application_submitted_applicant"
  | "application_submitted_owner"
  | "application_accepted"
  | "application_rejected"
  | "team_listing_pending"
  | "team_vet_request";

const TEAM_KINDS = new Set<WhatsAppNotificationKind>(["team_listing_pending", "team_vet_request"]);

/** Digits only, with Pakistan's country code. Returns null if it is not usable. */
export function normalizeWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("0092")) digits = digits.slice(2);
  else if (digits.startsWith("03")) digits = `92${digits.slice(1)}`;
  else if (digits.startsWith("3") && digits.length === 10) digits = `92${digits}`;

  return /^\d{10,15}$/.test(digits) ? digits : null;
}

interface QueueOptions {
  /** Required for customer messages. Team messages fan out to the configured team. */
  to?: string | null;
  /** Makes the event idempotent: a retry with the same key is dropped. */
  dedupeKey?: string;
}

export async function queueWhatsApp(
  kind: WhatsAppNotificationKind,
  params: Record<string, unknown>,
  options: QueueOptions = {},
): Promise<void> {
  try {
    const audience = TEAM_KINDS.has(kind) ? "team" : "customer";

    let to = "";
    if (audience === "customer") {
      const number = normalizeWhatsAppNumber(options.to);
      // No usable number is normal - most users have not given one - and is not
      // worth logging as an error.
      if (!number) return;
      to = number;
    }

    await db.query(
      `INSERT INTO bots.wa_outbox (to_number, kind, audience, params, dedupe_key)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       ON CONFLICT (dedupe_key) DO NOTHING`,
      [to, kind, audience, JSON.stringify(params), options.dedupeKey ?? null],
    );
  } catch (err) {
    console.error(`[whatsappNotify] could not queue ${kind}:`, err);
  }
}

/** Fire without awaiting, for use inside a request handler. */
export function queueWhatsAppAsync(
  kind: WhatsAppNotificationKind,
  params: Record<string, unknown>,
  options: QueueOptions = {},
): void {
  void queueWhatsApp(kind, params, options);
}
