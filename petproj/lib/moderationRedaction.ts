/**
 * A shadow-hide only works if the author can't tell it happened. Their feed,
 * profile and post detail all keep rendering the post exactly as before —
 * so the flag itself must never leave the server on a client-facing response.
 *
 * Most post/comment queries select `*`, which happily includes
 * is_shadow_hidden, so rather than rewriting every SELECT into an explicit
 * column list, every route that returns posts OR comments to the mobile app
 * runs its rows through here first (the field names are the same on both
 * tables, so this one function serves both — see its callers).
 *
 * A 'redacted' item is the opposite case: it's meant to stay fully visible,
 * just with the offending word(s) covered — see lib/moderation/badWords.ts
 * (redactSevereWords) and MentionText.tsx on the client, which renders the
 * REDACTED_WORD_MARKER sentinel as a grey chip. So this also rewrites
 * `content` in place for any row in that state, for every viewer including
 * the author — unlike shadow-hide, there's nothing to hide from them.
 *
 * Admin routes deliberately do NOT use this — the admin panel is exactly where
 * the flag (and, for review purposes, the original content) is supposed to
 * stay visible.
 */
import { redactSevereWords } from "./moderation/badWords";

/** Post/comment fields that would reveal a moderation decision to the author. */
const REDACTED_MODERATION_FIELDS = ['is_shadow_hidden'] as const;

/**
 * Strips moderation-only fields from post/comment rows in place, and
 * censors `content` for rows in the 'redacted' state. Accepts anything
 * (arrays, single rows, feed items that aren't posts/comments at all) so
 * callers don't have to branch. Mutates and returns the same value.
 */
export function redactModerationFields<T>(rows: T): T {
    if (Array.isArray(rows)) {
        for (const row of rows) redactModerationFields(row);
        return rows;
    }
    if (rows && typeof rows === 'object') {
        const row = rows as Record<string, unknown>;
        if (row.moderation_state === 'redacted' && typeof row.content === 'string') {
            row.content = redactSevereWords(row.content);
        }
        for (const field of REDACTED_MODERATION_FIELDS) {
            delete row[field];
        }
    }
    return rows;
}
