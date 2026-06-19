/**
 * @Mention parsing, validation, persistence, and notification dispatch.
 *
 * Storage model: post/comment `content` stays plain text. Mentions are
 * embedded as self-describing bracket tokens, using the EXACT wire format
 * produced by the React Native composer's `react-native-controlled-mentions`
 * library (`{trigger}[name](id)` — see its `triggerRegEx`), with our own
 * "type:numericId" convention packed into the id slot:
 *   {@}[alice_w](user:7)   — user mention, captured text is ALWAYS social_username
 *   {@}[Bella](pet:42)     — pet mention, captured text is the pet_profile's name
 *
 * This freezes the display text at mention-time (so renames never break
 * rendering) and links by id (so navigation always resolves to the current
 * profile). The `social_mentions` table is NOT used for rendering — it
 * exists purely for notification fan-out and mention lookups.
 *
 * The backend intentionally does NOT depend on the RN library — this regex
 * is just a plain-string mirror of its wire format, kept in sync manually.
 */

import { db } from "@/db/index";
import { SocialNotifications } from "@/lib/notifications";

export const MENTION_REGEX = /\{@\}\[([^\[\]]{1,100}?)\]\((user|pet):(\d+)\)/g;
export const MAX_MENTIONS_PER_CONTENT = 20;

export interface ParsedMention {
    displayName: string;
    type: "user" | "pet";
    id: number;
}

interface QueryClient {
    query: (text: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }>;
}

interface MentionTarget {
    postId?: string | number | bigint;
    commentId?: string | number | bigint;
}

/**
 * Pure regex extraction — no DB access. De-dupes by `type:id` and drops
 * any token whose captured display name is empty/whitespace-only (this can
 * only arise from a malformed/hand-crafted request — the composer UI never
 * produces an empty mention name).
 */
export function parseMentions(content: string | null | undefined): ParsedMention[] {
    if (!content) return [];

    const seen = new Set<string>();
    const mentions: ParsedMention[] = [];

    for (const match of content.matchAll(MENTION_REGEX)) {
        const displayName = match[1].trim();
        const type = match[2] as "user" | "pet";
        const id = parseInt(match[3], 10);

        if (!displayName || isNaN(id)) continue;

        const key = `${type}:${id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        mentions.push({ displayName, type, id });
    }

    return mentions;
}

/**
 * Validates parsed mentions against business rules. Throws on violation —
 * callers should map the thrown Error's message to a 400 response, mirroring
 * the existing `'One or more tagged pet profiles do not belong to you'`
 * pattern used by post_pet_tags.
 *
 * Rules enforced:
 *  - A `pet`-type mention must reference a pet_profile owned by authorUserId.
 *  - A `user`-type mention must reference a user that exists AND has a
 *    non-null social_username set (you can't mention someone with no handle —
 *    there's nothing stable to have frozen into the token).
 *  - A `pet`-type mention must reference a pet_profile that exists.
 *
 * Deliberately does NOT check blocks — a mention of a blocked/blocking user
 * is allowed to persist (it just won't generate a notification; see
 * notifyNewMentions below, and the suggestion endpoint already excludes
 * blocked users so this only arises from a manually-constructed mention).
 */
export async function validateMentions(
    client: QueryClient,
    mentions: ParsedMention[],
    authorUserId: number
): Promise<void> {
    if (mentions.length === 0) return;

    const petIds = mentions.filter((m) => m.type === "pet").map((m) => m.id);
    const userIds = mentions.filter((m) => m.type === "user").map((m) => m.id);

    if (petIds.length > 0) {
        const ownerCheck = await client.query(
            `SELECT COUNT(*) FROM pet_profiles WHERE pet_profile_id = ANY($1::int[]) AND owner_id = $2`,
            [petIds, authorUserId]
        );
        if (parseInt(ownerCheck.rows[0].count, 10) !== petIds.length) {
            throw new Error("One or more mentioned pet profiles do not belong to you");
        }
    }

    if (userIds.length > 0) {
        const userCheck = await client.query(
            `SELECT COUNT(*) FROM users WHERE user_id = ANY($1::int[]) AND social_username IS NOT NULL`,
            [userIds]
        );
        if (parseInt(userCheck.rows[0].count, 10) !== userIds.length) {
            throw new Error("One or more mentioned users do not exist or have no username set");
        }
    }
}

/**
 * Inserts social_mentions rows for the given parsed mentions, scoped to
 * exactly one of {postId, commentId}. MUST be called with a client that is
 * inside the SAME transaction as the parent post/comment insert (the FKs are
 * ON DELETE CASCADE, but inserting outside the transaction risks the mention
 * row outliving a rolled-back parent, or referencing a parent that never
 * commits). Duplicate-safe via ON CONFLICT DO NOTHING against the partial
 * unique indexes (parseMentions already de-dupes, this is just a backstop).
 */
export async function persistMentions(
    client: QueryClient,
    target: MentionTarget,
    mentions: ParsedMention[],
    mentionedBy: number
): Promise<void> {
    if (mentions.length === 0) return;

    const postId = target.postId ?? null;
    const commentId = target.commentId ?? null;

    for (const mention of mentions) {
        const mentionedUserId = mention.type === "user" ? mention.id : null;
        const mentionedPetId = mention.type === "pet" ? mention.id : null;

        await client.query(
            `INSERT INTO social_mentions (post_id, comment_id, mentioned_user_id, mentioned_pet_id, mentioned_by)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING`,
            [postId, commentId, mentionedUserId, mentionedPetId, mentionedBy]
        );
    }
}

/**
 * Deletes all social_mentions rows for the given post/comment. Used by the
 * edit-flow "delete old, reparse, reinsert" pattern (mirrors the existing
 * post_hashtags delete-then-reinsert in posts/[id]/route.ts PATCH).
 */
export async function deleteMentions(client: QueryClient, target: MentionTarget): Promise<void> {
    if (target.postId !== undefined) {
        await client.query(`DELETE FROM social_mentions WHERE post_id = $1`, [target.postId]);
    } else if (target.commentId !== undefined) {
        await client.query(`DELETE FROM social_mentions WHERE comment_id = $1`, [target.commentId]);
    }
}

/**
 * Fire-and-forget notification dispatch for a set of mentions. Callers are
 * responsible for only passing NEWLY-added mentions on edit (diff old vs.
 * new) so re-saving a post doesn't re-notify already-notified mentions.
 *
 * Must be called strictly AFTER the parent transaction commits, exactly like
 * the existing onPostCommented/onCommentReplied dispatch in comments/route.ts.
 *
 * - User mentions: notify the mentioned user directly.
 * - Pet mentions: notify the pet's owner (you can only mention pets you
 *   already own, so the owner is never the mentioner — no self-notify risk).
 * Reuses the existing onMentionedInPost/onMentionedInComment triggers for
 * both cases (generic "mentioned you" copy covers the pet case fine, since
 * the pet's owner IS the one being told "you were mentioned").
 *
 * NotificationService.createAndSend already no-ops self-notifications and
 * blocked-pair notifications internally, so no extra checks are needed here
 * beyond resolving a pet mention to its owner's user id.
 */
export async function notifyNewMentions(
    mentions: ParsedMention[],
    context: {
        mentionerId: number;
        mentionerName: string;
        postId: number;
        isComment: boolean;
        postImageUrl?: string;
    }
): Promise<void> {
    if (mentions.length === 0) return;

    const userMentionIds = mentions.filter((m) => m.type === "user").map((m) => m.id);
    const petMentionIds = mentions.filter((m) => m.type === "pet").map((m) => m.id);

    const recipientIds = new Set<number>(userMentionIds);

    if (petMentionIds.length > 0) {
        try {
            const ownersRes = await db.query(
                `SELECT pet_profile_id, owner_id FROM pet_profiles WHERE pet_profile_id = ANY($1::int[])`,
                [petMentionIds]
            );
            for (const row of ownersRes.rows) {
                recipientIds.add(row.owner_id);
            }
        } catch (err) {
            console.error("notifyNewMentions: failed to resolve pet owners", err);
        }
    }

    const trigger = context.isComment
        ? SocialNotifications.onMentionedInComment
        : SocialNotifications.onMentionedInPost;

    await Promise.allSettled(
        Array.from(recipientIds).map((recipientId) =>
            trigger(recipientId, context.mentionerId, context.postId, context.mentionerName, context.postImageUrl).catch(
                (err: unknown) => console.error("notifyNewMentions: notification dispatch failed", err)
            )
        )
    );
}
