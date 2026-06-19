import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { rateLimit, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/mentions/suggest?q=<text>&limit=<n>
 * @mention suggestions for the composer dropdown. Returns the viewer's OWN
 * pet profiles (never another user's) plus suggested people — grouped, not
 * merged, so the client can render "Your pets" then "People" without any
 * client-side re-sorting.
 *
 * `q` is matched as a prefix against both username and name (and any word
 * within the name), not full-text search — this fires on every debounced
 * keystroke and needs to stay fast and prefix-shaped.
 */
export async function GET(req: NextRequest) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const limited = await rateLimit(req, LIMITS.MENTION_SUGGEST);
        if (limited) return limited;

        const { searchParams } = new URL(req.url);
        let q = (searchParams.get("q") || "").trim();
        if (q.startsWith("@")) q = q.slice(1);
        const limit = Math.min(30, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

        await db.query("SET LOCAL statement_timeout = '800ms'");

        // ── Pets: always the viewer's own, never another user's ──────────────
        const petsRes = await db.query(
            `
            SELECT pet_profile_id, name, species, avatar_url
            FROM pet_profiles
            WHERE owner_id = $1
              AND ($2 = '' OR name ILIKE $2 || '%')
            ORDER BY created_at DESC
            LIMIT $3
            `,
            [userId, q, limit]
        );

        // ── People: prefix-match username/name/word-in-name, block-filtered ──
        // Default (q empty) = people you follow, ranked by follower_count.
        // With q = anyone matching, followed people ranked first.
        const usersRes = await db.query(
            `
            SELECT u.user_id, u.name, u.social_username, u.profile_image_url,
                   EXISTS(SELECT 1 FROM social_follows WHERE follower_id = $1 AND following_id = u.user_id) AS is_following
            FROM users u
            WHERE u.user_id != $1
              AND u.social_username IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM user_blocks b
                  WHERE (b.blocker_id = $1 AND b.blocked_id = u.user_id)
                     OR (b.blocker_id = u.user_id AND b.blocked_id = $1)
              )
              AND (
                  ($2 = '' AND EXISTS(SELECT 1 FROM social_follows WHERE follower_id = $1 AND following_id = u.user_id))
                  OR (
                      $2 != ''
                      AND (
                          u.social_username ILIKE $2 || '%'
                          OR u.name ILIKE $2 || '%'
                          OR u.name ILIKE '% ' || $2 || '%'
                      )
                  )
              )
            ORDER BY
              EXISTS(SELECT 1 FROM social_follows WHERE follower_id = $1 AND following_id = u.user_id) DESC,
              u.follower_count DESC NULLS LAST
            LIMIT $3
            `,
            [userId, q, limit]
        );

        return NextResponse.json({
            pets: petsRes.rows.map((p) => ({
                type: "pet" as const,
                pet_profile_id: p.pet_profile_id,
                name: p.name,
                species: p.species,
                avatar_url: p.avatar_url,
            })),
            users: usersRes.rows.map((u) => ({
                type: "user" as const,
                user_id: u.user_id,
                name: u.name,
                social_username: u.social_username,
                profile_image_url: u.profile_image_url,
                is_following: u.is_following,
            })),
        });
    } catch (error) {
        console.error("V1 Mentions Suggest GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
