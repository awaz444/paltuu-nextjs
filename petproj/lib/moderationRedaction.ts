/**
 * A shadow-hide only works if the author can't tell it happened. Their feed,
 * profile and post detail all keep rendering the post exactly as before —
 * so the flag itself must never leave the server on a client-facing response.
 *
 * Most post queries select `p.*`, which happily includes is_shadow_hidden, so
 * rather than rewriting every SELECT into an explicit column list, every route
 * that returns posts to the mobile app runs its rows through here first.
 *
 * Admin routes deliberately do NOT use this — the admin panel is exactly where
 * the flag is supposed to be visible.
 */

/** Post fields that would reveal a moderation decision to the post's author. */
const REDACTED_POST_FIELDS = ['is_shadow_hidden'] as const;

/**
 * Strips moderation-only fields from post rows in place. Accepts anything
 * (arrays, single rows, feed items that aren't posts at all) so callers don't
 * have to branch. Mutates and returns the same value.
 */
export function redactModerationFields<T>(rows: T): T {
    if (Array.isArray(rows)) {
        for (const row of rows) redactModerationFields(row);
        return rows;
    }
    if (rows && typeof rows === 'object') {
        for (const field of REDACTED_POST_FIELDS) {
            delete (rows as Record<string, unknown>)[field];
        }
    }
    return rows;
}
