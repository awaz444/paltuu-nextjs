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
 * shadow_hide_reason (posts only) is a deliberate, narrow exception to the
 * "author can't tell" rule: when a post is shadow-hidden WITH a reason set
 * (currently only 'pet_sale' — see lib/moderation/petSaleDetection.ts and
 * the admin moderate route), the reason is allowed back to that post's own
 * author, so the client can show them a "why is this hidden" notice. A
 * generic admin shadow-hide with no reason stays exactly as invisible as
 * before. Callers must pass `viewerId` for this to apply — without it, or
 * for any other viewer, or on any other row, the field is stripped same as
 * is_shadow_hidden always was.
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
 *
 * `viewerId` is optional and only matters for `shadow_hide_reason` — pass
 * the requesting user's id so their own reasoned shadow-hides keep that
 * field; omitted (or any other viewer's rows) always has it stripped.
 * Compared as strings since post/comment `user_id` and the caller's viewer
 * id aren't guaranteed to be the same JS type (string from a JWT vs number
 * from Postgres).
 */
export function redactModerationFields<T>(rows: T, viewerId?: number | string): T {
    if (Array.isArray(rows)) {
        for (const row of rows) redactModerationFields(row, viewerId);
        return rows;
    }
    if (rows && typeof rows === 'object') {
        const row = rows as Record<string, unknown>;
        if (row.moderation_state === 'redacted' && typeof row.content === 'string') {
            row.content = redactSevereWords(row.content);
        }
        const keepReason =
            row.is_shadow_hidden === true &&
            !!row.shadow_hide_reason &&
            viewerId !== undefined &&
            String(row.user_id) === String(viewerId);
        if (!keepReason) {
            delete row.shadow_hide_reason;
        }
        for (const field of REDACTED_MODERATION_FIELDS) {
            delete row[field];
        }
    }
    return rows;
}
