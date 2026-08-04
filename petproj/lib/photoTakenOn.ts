/**
 * Validation for a gallery polaroid's optional "taken on" date.
 *
 * Shared by the photo POST (upload) and PATCH (edit) routes so the two can't
 * drift into accepting different things.
 *
 * The value is a plain calendar day as `YYYY-MM-DD` — never a timestamp. The
 * client sends exactly what the user picked, and the DATE column stores it
 * verbatim, so no timezone ever gets a chance to shift the day.
 */

export type TakenOnResult =
    | { ok: true; value: string | null }
    | { ok: false; error: string };

// The earliest plausible photo date. Not a real limit on pet photos so much as
// a guard against a mis-keyed year ("0202") silently storing as a valid date.
const MIN_YEAR = 1900;

/**
 * Parses a raw `taken_on` off a request body.
 *
 * `null` and `''` both mean "clear the date" and are valid — the field is
 * optional by design. `undefined` is the caller's signal that the key was
 * absent entirely; callers that support partial updates should check for that
 * BEFORE calling this, so an untouched field isn't wiped.
 */
export function parseTakenOn(raw: unknown): TakenOnResult {
    if (raw === null || raw === undefined || raw === "") {
        return { ok: true, value: null };
    }

    if (typeof raw !== "string") {
        return { ok: false, error: "taken_on must be a YYYY-MM-DD string" };
    }

    const trimmed = raw.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!match) {
        return { ok: false, error: "taken_on must be formatted YYYY-MM-DD" };
    }

    const [, yStr, mStr, dStr] = match;
    const year = Number(yStr);
    const month = Number(mStr);
    const day = Number(dStr);

    // Round-tripping through UTC catches days that pass the regex but don't
    // exist — 2023-02-30 or 2023-11-31 would otherwise reach Postgres and
    // come back as a 500 instead of a clean 400.
    const asDate = new Date(Date.UTC(year, month - 1, day));
    const roundTrips =
        asDate.getUTCFullYear() === year &&
        asDate.getUTCMonth() === month - 1 &&
        asDate.getUTCDate() === day;

    if (!roundTrips) {
        return { ok: false, error: "taken_on is not a real calendar date" };
    }

    if (year < MIN_YEAR) {
        return { ok: false, error: `taken_on must be on or after ${MIN_YEAR}` };
    }

    // Compared against UTC "today" rather than server-local midnight, and with
    // a full day of slack, so a user in a timezone ahead of the server can
    // still tag a photo "today" without it reading as the future.
    const now = new Date();
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    if (asDate.getTime() > todayUtc + 24 * 60 * 60 * 1000) {
        return { ok: false, error: "taken_on cannot be in the future" };
    }

    return { ok: true, value: trimmed };
}
