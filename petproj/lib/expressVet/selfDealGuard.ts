import { db } from "@/db/index";

/**
 * Self-dealing guard for Vets at Home (Express Vet).
 *
 * The threat is not "one app vs two apps" — splitting the dispatcher console into a
 * separate app would not help at all here. The same human can hold a pet-owner account
 * AND a dispatcher account, create a request on one and claim + self-assign it on the
 * other: farming payouts, inflating job counts, writing their own reviews. So the check
 * has to live at the request/assignment layer, on the backend, where both identities are
 * visible at once.
 *
 * Comparing `client_user_id !== dispatcher_id` is necessary but nowhere near sufficient —
 * that only catches someone who forgot to switch accounts. We resolve both sides to an
 * *underlying identity* across every signal we actually have:
 *
 *   account       — same user_id on both sides (the naive check)
 *   provider_link — the assigned provider row is linked to the requesting user
 *   phone         — the request's contact phone, or either account's profile phone,
 *                   normalises to the same number
 *   device        — both accounts have been seen on the same physical handset
 *                   (see user_device_account_links in the migration for why this
 *                   needs its own append-only table)
 *
 * Payment method is deliberately absent from that list: this feature has no payment
 * rail at all — `final_price_pkr` is an agreed-price snapshot, explicitly "not a
 * transaction record" (see the schema comment), and money changes hands off-app. There
 * is nothing to correlate. If payments are ever brought in-app, add a `payment` signal
 * here rather than re-deriving this logic somewhere else.
 *
 * Blocking policy: `account`, `provider_link` and `phone` are hard blocks — each one
 * on its own means the two sides are the same person. `device` alone is NOT a block:
 * families, flatmates and shared clinic tablets genuinely share handsets, and refusing
 * real jobs is worse than logging them. A device match is recorded as a flag for review,
 * and escalates to a block when it appears alongside any other signal.
 */

export type SelfDealSignal = "account" | "provider_link" | "phone" | "device";

export type SelfDealStage = "claim" | "assign";

export interface SelfDealVerdict {
  /** True when the action must be refused. */
  blocked: boolean;
  /** Every signal that matched, strongest first. */
  signals: SelfDealSignal[];
  /** Human-readable summary, safe to log; not returned verbatim to the client. */
  detail: string;
}

/** Signals that on their own prove the two sides are one identity. */
const HARD_SIGNALS: SelfDealSignal[] = ["account", "provider_link", "phone"];

/**
 * Reduce a phone number to a comparable key.
 *
 * Numbers reach us in every shape a user might type: `0300 1234567`, `+92 300 1234567`,
 * `0092-300-1234567`, `300 1234567`. Pakistani mobile numbers are 10 significant digits
 * after the country code / trunk zero, so the last 10 digits are the stable part across
 * all of those forms. Returns null for anything too short to compare meaningfully —
 * callers must treat null as "no signal", never as a match.
 */
export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length < 9) return null;
  return digits.slice(-10);
}

/** Non-null, non-empty normalized phones from a set of raw inputs. */
function phoneKeys(...raw: (string | null | undefined)[]): Set<string> {
  const out = new Set<string>();
  for (const r of raw) {
    const k = normalizePhone(r);
    if (k) out.add(k);
  }
  return out;
}

interface RequestIdentity {
  request_id: string | number;
  client_user_id: number;
  contact_phone?: string | null;
}

interface ProviderIdentity {
  provider_id?: string | number | null;
  linked_user_id?: number | null;
  phone_number?: string | null;
}

/**
 * Resolve whether `dispatcherId` (optionally acting through `provider`) is the same
 * underlying identity as the requester on `requestRow`.
 *
 * Read-only and side-effect free — persisting the outcome is `recordSelfDealFlag`'s job,
 * so callers can decide independently whether a given verdict is worth storing.
 */
export async function detectSelfDeal(params: {
  requestRow: RequestIdentity;
  dispatcherId: number;
  provider?: ProviderIdentity | null;
}): Promise<SelfDealVerdict> {
  const { requestRow, dispatcherId, provider } = params;
  const clientUserId = Number(requestRow.client_user_id);
  const signals: SelfDealSignal[] = [];
  const notes: string[] = [];

  // ── 1. Same account ───────────────────────────────────────────────────────
  if (clientUserId === Number(dispatcherId)) {
    signals.push("account");
    notes.push(`dispatcher ${dispatcherId} is the requester`);
  }

  // ── 2. Provider row linked to the requesting user ─────────────────────────
  // Covers "assign to myself" and the subtler case of assigning a provider row
  // that was linked to the requester's account at some earlier point.
  const providerLinkedUserId =
    provider?.linked_user_id != null ? Number(provider.linked_user_id) : null;
  if (providerLinkedUserId != null && providerLinkedUserId === clientUserId) {
    signals.push("provider_link");
    notes.push(`provider ${provider?.provider_id} is linked to requester ${clientUserId}`);
  }

  // The set of user_ids acting on the *provider* side of this job.
  const providerSideUserIds = [Number(dispatcherId)];
  if (providerLinkedUserId != null && !providerSideUserIds.includes(providerLinkedUserId)) {
    providerSideUserIds.push(providerLinkedUserId);
  }

  // ── 3. Phone number ───────────────────────────────────────────────────────
  // One query for every user row involved, rather than one per side.
  const allUserIds = Array.from(new Set([clientUserId, ...providerSideUserIds]));
  const usersRes = await db.query(
    `SELECT user_id, phone_number FROM users WHERE user_id = ANY($1)`,
    [allUserIds]
  );
  const phoneByUserId = new Map<number, string | null>(
    usersRes.rows.map((r: any) => [Number(r.user_id), r.phone_number])
  );

  const clientPhones = phoneKeys(requestRow.contact_phone, phoneByUserId.get(clientUserId));
  const providerPhones = phoneKeys(
    provider?.phone_number,
    ...providerSideUserIds.map((uid) => phoneByUserId.get(uid))
  );

  const sharedPhone = [...clientPhones].find((p) => providerPhones.has(p));
  if (sharedPhone) {
    signals.push("phone");
    // Log only the last 4 digits — this lands in server logs and an audit table.
    notes.push(`shared phone ending ${sharedPhone.slice(-4)}`);
  }

  // ── 4. Shared device ──────────────────────────────────────────────────────
  // Append-only history, so this still fires after the same handset re-registered
  // under the second account and overwrote user_devices.user_id.
  const deviceRes = await db.query(
    `SELECT a.user_id AS client_side, b.user_id AS provider_side, a.fcm_token
       FROM user_device_account_links a
       JOIN user_device_account_links b ON a.fcm_token = b.fcm_token
      WHERE a.user_id = $1 AND b.user_id = ANY($2)
      LIMIT 1`,
    [clientUserId, providerSideUserIds]
  );
  if ((deviceRes.rowCount ?? 0) > 0) {
    signals.push("device");
    notes.push(
      `requester ${clientUserId} and provider-side account ${deviceRes.rows[0].provider_side} share a device`
    );
  }

  const hasHardSignal = signals.some((s) => HARD_SIGNALS.includes(s));
  // A device match alone is not proof; combined with anything else it is.
  const blocked = hasHardSignal || signals.length > 1;

  return {
    blocked,
    signals,
    detail: notes.join("; "),
  };
}

/**
 * Persist a verdict to express_vet_self_deal_flags.
 *
 * Best-effort on purpose: this is an audit trail, and losing a row must never turn into
 * a 500 on a dispatcher's claim/assign. Failures are logged and swallowed.
 */
export async function recordSelfDealFlag(params: {
  requestId: string | number;
  dispatcherId: number;
  providerId?: string | number | null;
  stage: SelfDealStage;
  verdict: SelfDealVerdict;
}): Promise<void> {
  const { requestId, dispatcherId, providerId, stage, verdict } = params;
  if (verdict.signals.length === 0) return;

  try {
    await db.query(
      `INSERT INTO express_vet_self_deal_flags
         (request_id, dispatcher_id, provider_id, stage, signals, blocked, detail)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [requestId, dispatcherId, providerId ?? null, stage, verdict.signals, verdict.blocked, verdict.detail]
    );
  } catch (error) {
    console.error("⚠️ Failed to record express-vet self-deal flag:", error);
  }
}

/**
 * Convenience wrapper: detect, always record, and return the verdict.
 *
 * The message handed back to the client stays deliberately vague — naming which signal
 * matched would tell someone probing the system exactly which identity to change next.
 * The specifics live in the flags table and the server log.
 */
export async function checkSelfDeal(params: {
  requestRow: RequestIdentity;
  dispatcherId: number;
  provider?: ProviderIdentity | null;
  stage: SelfDealStage;
}): Promise<{ verdict: SelfDealVerdict; clientMessage: string | null }> {
  const verdict = await detectSelfDeal(params);

  if (verdict.signals.length > 0) {
    await recordSelfDealFlag({
      requestId: params.requestRow.request_id,
      dispatcherId: params.dispatcherId,
      providerId: params.provider?.provider_id ?? null,
      stage: params.stage,
      verdict,
    });
    console.warn(
      `⚠️ express-vet self-deal ${verdict.blocked ? "BLOCKED" : "flagged"} at ${params.stage} ` +
        `(request ${params.requestRow.request_id}, dispatcher ${params.dispatcherId}): ` +
        `[${verdict.signals.join(", ")}] ${verdict.detail}`
    );
  }

  return {
    verdict,
    clientMessage: verdict.blocked
      ? "This request can't be handled from this account. Please hand it to another dispatcher."
      : null,
  };
}
