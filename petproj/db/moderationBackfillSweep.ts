import pg from 'pg';
const { Pool } = pg;
import * as dotenv from 'dotenv';
import path from 'path';

// IMPORTANT: the live database is on AWS RDS behind NEW_DATABASE_URL (see db/index.ts).
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { hasSevereMatch, hasSevereIdentityMatch } from '../lib/moderation/badWords';
import { fanOutPostToFollowers } from '../lib/redis';

const connectionString = process.env.NEW_DATABASE_URL;
if (!connectionString) {
    throw new Error('NEW_DATABASE_URL environment variable is not set.');
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

/**
 * One-time sweep for content/accounts that predate the profanity/slur
 * checker (lib/moderation/badWords.ts) — it only runs on NEW writes, so
 * anything posted before it existed slips through until this is run.
 *
 * Posts and comments: auto-REDACT on a SEVERE match, exactly like the live
 * POST handlers do for new content — the item stays visible in place with
 * only the offending word covered, because hiding a reply outright orphans
 * its replies and breaks the thread's connecting line. Safe and reversible
 * (an admin can flip moderation_state back to 'none' any time), so it's
 * applied automatically here.
 *
 * Names/usernames/bios can't be shadow-hidden (always fully public
 * identity, not a feed item):
 *   - Users: auto-suspended (is_suspended = true) on a SEVERE match — this
 *     is a deliberate product call (not every mis-fire risk clears this
 *     bar, but the founder decided speed matters more here). A suspended
 *     account is publicly shown as suspended (see
 *     app/api/v1/social/profile/[id]/route.ts) and blocked at login. Data
 *     is never mutated/renamed — only PATCH /api/v1/admin/users/:id/suspend
 *     with { suspended: false } reverses a false positive.
 *   - Pet profiles / adoption listings: no login/suspend concept applies,
 *     so these stay FLAG-ONLY (logged to admin_action_logs + printed to the
 *     console) for manual review.
 */
async function run() {
    const client = await pool.connect();
    try {
        console.log('=== Moderation backfill sweep ===\n');

        // ── 1. Posts ─────────────────────────────────────────────────────────
        // 'shadow_hidden' rows are re-swept too: an earlier run of this script
        // hid them outright, which the redaction approach replaced. Restoring
        // them to visible-but-censored also puts is_shadow_hidden back to
        // false, so they need re-adding to the follower caches they were
        // pulled from.
        console.log('Scanning social_posts...');
        const posts = await client.query(
            `SELECT post_id, user_id, content, created_at, is_shadow_hidden FROM social_posts
             WHERE is_deleted = false AND content IS NOT NULL
               AND (moderation_state IS NULL OR moderation_state IN ('none', 'shadow_hidden'))`
        );
        let postsRedacted = 0;
        for (const row of posts.rows) {
            if (!hasSevereMatch(row.content)) continue;
            await client.query(
                `UPDATE social_posts SET moderation_state = 'redacted', is_shadow_hidden = false WHERE post_id = $1`,
                [row.post_id]
            );
            await client.query(
                `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
                 VALUES (NULL, 'auto_redact:backfill_sweep', $1, 'successful')`,
                [`post:${row.post_id}`]
            );
            if (row.is_shadow_hidden) {
                await fanOutPostToFollowers(row.post_id, row.user_id, row.created_at, client).catch(() => {});
            }
            postsRedacted++;
            console.log(`  redacted post ${row.post_id} (user ${row.user_id})${row.is_shadow_hidden ? ' [un-hidden]' : ''}`);
        }
        console.log(`Posts redacted: ${postsRedacted}\n`);

        // ── 2. Comments (needs the comment_moderation_migration columns) ───────
        const commentCols = await client.query(
            `SELECT 1 FROM information_schema.columns
             WHERE table_name = 'social_comments' AND column_name = 'moderation_state'`
        );
        let commentsRedacted = 0;
        if ((commentCols.rowCount ?? 0) === 0) {
            console.log('Skipping social_comments — run db/comment_moderation_migration.ts first.\n');
        } else {
            console.log('Scanning social_comments...');
            const comments = await client.query(
                `SELECT comment_id, user_id, content, is_shadow_hidden FROM social_comments
                 WHERE is_deleted = false AND content IS NOT NULL
                   AND (moderation_state IS NULL OR moderation_state IN ('none', 'shadow_hidden'))`
            );
            for (const row of comments.rows) {
                if (!hasSevereMatch(row.content)) continue;
                await client.query(
                    `UPDATE social_comments SET moderation_state = 'redacted', is_shadow_hidden = false WHERE comment_id = $1`,
                    [row.comment_id]
                );
                await client.query(
                    `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
                     VALUES (NULL, 'auto_redact:backfill_sweep', $1, 'successful')`,
                    [`comment:${row.comment_id}`]
                );
                commentsRedacted++;
                console.log(`  redacted comment ${row.comment_id} (user ${row.user_id})${row.is_shadow_hidden ? ' [un-hidden]' : ''}`);
            }
            console.log(`Comments redacted: ${commentsRedacted}\n`);
        }

        // ── 3. Users: name / social_username / bio -> auto-suspend ─────────────
        const userSuspendCols = await client.query(
            `SELECT 1 FROM information_schema.columns
             WHERE table_name = 'users' AND column_name = 'is_suspended'`
        );
        let usersSuspended = 0;
        if ((userSuspendCols.rowCount ?? 0) === 0) {
            console.log('Skipping users — run db/moderationRedactionAndSuspension_migration.ts first.\n');
        } else {
        console.log('Scanning users (name / social_username / bio)...');
        const users = await client.query(`SELECT user_id, name, social_username, bio FROM users WHERE is_suspended = false`);
        for (const row of users.rows) {
            const hits: string[] = [];
            if (row.name && hasSevereIdentityMatch(row.name)) hits.push('name');
            if (row.social_username && hasSevereIdentityMatch(row.social_username)) hits.push('social_username');
            if (row.bio && hasSevereIdentityMatch(row.bio)) hits.push('bio');
            if (hits.length === 0) continue;

            const reason = `Auto-suspended: severe language detected in ${hits.join(', ')} (backfill sweep)`;
            await client.query(
                `UPDATE users SET is_suspended = true, suspension_reason = $2, suspended_at = NOW() WHERE user_id = $1`,
                [row.user_id, reason]
            );
            await client.query(
                `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
                 VALUES (NULL, $1, $2, 'successful')`,
                [`auto_suspend:backfill_sweep:${hits.join(',')}`, `user:${row.user_id}`]
            );
            usersSuspended++;
            console.log(`  SUSPENDED user ${row.user_id} (@${row.social_username}, "${row.name}") — ${hits.join(', ')}`);
        }
        console.log(`Users auto-suspended: ${usersSuspended}\n`);
        console.log('Review suspended accounts in the admin panel — PATCH /api/v1/admin/users/:id/suspend with { suspended: false } reverses a false positive.\n');
        }

        // ── 4. Pet profiles: name / bio — flag only ─────────────────────────────
        console.log('Scanning pet_profiles (name / bio)...');
        const petProfiles = await client.query(`SELECT pet_profile_id, owner_id, name, bio FROM pet_profiles`);
        let petProfilesFlagged = 0;
        for (const row of petProfiles.rows) {
            const hits: string[] = [];
            if (row.name && hasSevereIdentityMatch(row.name)) hits.push('name');
            if (row.bio && hasSevereIdentityMatch(row.bio)) hits.push('bio');
            if (hits.length === 0) continue;

            await client.query(
                `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
                 VALUES (NULL, $1, $2, 'successful')`,
                [`flagged_severe_identity:backfill_sweep:${hits.join(',')}`, `pet_profile:${row.pet_profile_id}`]
            );
            petProfilesFlagged++;
            console.log(`  FLAGGED pet profile ${row.pet_profile_id} (owner ${row.owner_id}, "${row.name}") — ${hits.join(', ')}`);
        }
        console.log(`Pet profiles flagged for manual review: ${petProfilesFlagged}\n`);

        // ── 5. Adoption listings: pet_name / description — flag only ───────────
        console.log('Scanning pets (adoption listings — pet_name / description)...');
        const listings = await client.query(`SELECT pet_id, owner_id, pet_name, description FROM pets`);
        let listingsFlagged = 0;
        for (const row of listings.rows) {
            const hits: string[] = [];
            if (row.pet_name && hasSevereIdentityMatch(row.pet_name)) hits.push('pet_name');
            if (row.description && hasSevereIdentityMatch(row.description)) hits.push('description');
            if (hits.length === 0) continue;

            await client.query(
                `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
                 VALUES (NULL, $1, $2, 'successful')`,
                [`flagged_severe_identity:backfill_sweep:${hits.join(',')}`, `pet_listing:${row.pet_id}`]
            );
            listingsFlagged++;
            console.log(`  FLAGGED listing ${row.pet_id} (owner ${row.owner_id}, "${row.pet_name}") — ${hits.join(', ')}`);
        }
        console.log(`Adoption listings flagged for manual review: ${listingsFlagged}\n`);

        console.log('=== Done ===');
        console.log(`Posts redacted: ${postsRedacted} | Comments redacted: ${commentsRedacted} | Users suspended: ${usersSuspended} | Pet profiles flagged: ${petProfilesFlagged} | Listings flagged: ${listingsFlagged}`);
        console.log('\nSuspended users are now publicly shown as suspended and blocked from logging in.');
        console.log('Flagged pet profiles/listings were NOT modified — review them in the admin panel and action manually.');
    } finally {
        client.release();
        await pool.end();
    }
}

run().catch((err) => {
    console.error('Backfill sweep failed:', err);
    process.exit(1);
});
