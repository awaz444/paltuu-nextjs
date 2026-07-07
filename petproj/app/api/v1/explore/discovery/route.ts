import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * Common English stopwords + social filler, so trending keywords surface
 * meaningful terms (pet, adopt, rescue, foster…) rather than glue words.
 * Kept intentionally broad; short pet-relevant words (dog, cat, vet) are
 * deliberately NOT included so they can still trend.
 */
const STOPWORDS = [
    "the", "and", "for", "are", "but", "not", "you", "all", "any", "can", "had", "her",
    "was", "one", "our", "out", "has", "him", "his", "how", "its", "let", "put", "say",
    "she", "too", "use", "who", "did", "get", "got", "why", "yes", "yet", "day", "new",
    "now", "old", "see", "two", "way", "off", "own", "per", "than", "that", "this", "with",
    "have", "from", "they", "will", "your", "been", "were", "what", "when", "then", "them",
    "some", "such", "very", "just", "like", "into", "over", "only", "also", "more", "most",
    "much", "many", "here", "there", "their", "would", "could", "should", "about", "which",
    "these", "those", "being", "doing", "going", "gonna", "wanna", "really", "still", "even",
    "want", "wants", "need", "needs", "know", "make", "made", "take", "come", "back", "good",
    "great", "love", "loves", "loved", "today", "guys", "everyone", "everything", "anyone",
    "something", "someone", "http", "https", "www", "com", "dont", "cant", "wont", "didnt",
    "ive", "youre", "youll", "thats", "isnt", "arent", "wasnt", "lol", "omg", "haha",
    "please", "thanks", "thank", "hello", "yeah", "okay", "sure", "well", "one",
];

/**
 * Standard Error Envelope
 */
function errorResponse(code: string, message: string, status: number) {
    return NextResponse.json(
        {
            error: {
                code,
                message,
                status,
            },
        },
        { status }
    );
}

/**
 * GET /api/v1/explore/discovery
 * Returns idle-state data for the explore screen
 */
export async function GET(req: NextRequest) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return errorResponse("UNAUTHORIZED", "Missing or invalid JWT", 401);
        const userId = parseInt(String(userIdRaw), 10);

        const [keywordsRes, mediaPostsRes, breedsRes] = await Promise.all([
            // Trending keywords — the words people are actually engaging with. We
            // tokenize the content of posts from the last 21 days (stripping URLs,
            // @mentions and #hashtags), drop stopwords, and rank each word by the
            // summed engagement (likes + weighted comments, +1 per post) of the posts
            // it appears in. A word must show up in >= 2 distinct posts to count as
            // "trending" (filters one-off noise). Blocked authors excluded.
            db.query(`
                WITH recent_posts AS (
                    SELECT
                        p.post_id,
                        regexp_replace(
                            regexp_replace(
                                -- Strip encoded mention tokens first: {@}[Display Name](user:id)
                                -- / [Name](pet:id). These carry the literal words "user"/"pet"
                                -- and usernames, which must not count as content keywords.
                                regexp_replace(lower(p.content), '\\[[^\\]]*\\]\\([^)]*\\)', ' ', 'g'),
                                '(https?://\\S+|www\\.\\S+|\\{[@#]\\}|[@#][a-z0-9_]+)', ' ', 'g'
                            ),
                            '[^a-z0-9\\s]', ' ', 'g'
                        ) AS cleaned,
                        (COALESCE(p.like_count, 0) * 2 + COALESCE(p.comment_count, 0) * 3 + 1)::numeric AS weight
                    FROM social_posts p
                    JOIN users u ON u.user_id = p.user_id
                    WHERE p.is_deleted = false
                      AND p.is_hidden = false
                      AND u.is_private = false
                      AND p.created_at >= NOW() - INTERVAL '21 days'
                      AND p.content IS NOT NULL AND p.content <> ''
                      AND NOT EXISTS (
                          SELECT 1 FROM user_blocks b
                          WHERE (b.blocker_id = $1 AND b.blocked_id = p.user_id)
                             OR (b.blocker_id = p.user_id AND b.blocked_id = $1)
                      )
                ),
                tokens AS (
                    SELECT rp.post_id, rp.weight, w.word
                    FROM recent_posts rp
                    CROSS JOIN LATERAL regexp_split_to_table(rp.cleaned, '\\s+') AS w(word)
                    WHERE length(w.word) >= 3
                      AND w.word !~ '^[0-9]+$'
                      AND w.word <> ALL($2::text[])
                )
                SELECT
                    word AS keyword,
                    COUNT(DISTINCT post_id)::int AS post_count,
                    SUM(weight) AS engagement_score
                FROM tokens
                GROUP BY word
                HAVING COUNT(DISTINCT post_id) >= 2
                ORDER BY engagement_score DESC, post_count DESC
                LIMIT 15
            `, [userId, STOPWORDS]),

            // Media grid — "most interacted media" first. Ranked purely by a
            // time-decayed engagement score (likes/comments/reposts weighted, with a
            // gravity decay so the grid stays fresh instead of pinning all-time hits
            // forever). Scoped to the last year so the scan stays bounded; excludes
            // private and blocked authors.
            db.query(`
                WITH candidate_posts AS (
                    SELECT
                        p.post_id, p.content, p.like_count, p.comment_count, p.repost_count, p.created_at,
                        u.user_id, u.name AS author_name,
                        u.social_username, u.profile_image_url AS author_image,
                        (
                            ((COALESCE(p.like_count, 0) * 2)
                             + (COALESCE(p.comment_count, 0) * 3)
                             + (COALESCE(p.repost_count, 0) * 4) + 1)
                            / POWER((EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600.0) + 2, 1.15)
                        ) AS rank_score
                    FROM social_posts p
                    JOIN users u ON u.user_id = p.user_id
                    WHERE p.is_deleted = false
                      AND p.is_hidden = false
                      AND u.is_private = false
                      AND p.created_at >= NOW() - INTERVAL '365 days'
                      AND EXISTS (SELECT 1 FROM social_post_media m WHERE m.post_id = p.post_id)
                      AND NOT EXISTS (
                          SELECT 1 FROM user_blocks b
                          WHERE (b.blocker_id = $1 AND b.blocked_id = p.user_id)
                             OR (b.blocker_id = p.user_id AND b.blocked_id = $1)
                      )
                )
                SELECT
                    cp.post_id, cp.content, cp.like_count, cp.comment_count, cp.repost_count, cp.created_at,
                    cp.user_id, cp.author_name, cp.social_username, cp.author_image,
                    (SELECT json_agg(m.* ORDER BY m.ordering) FROM social_post_media m WHERE m.post_id = cp.post_id) AS media
                FROM candidate_posts cp
                ORDER BY cp.rank_score DESC, cp.created_at DESC, cp.post_id DESC
                LIMIT 30
            `, [userId]),

            // Trending breeds — derived from pets + adoption_listings
            db.query(`
                SELECT breed,
                       COUNT(*) FILTER (WHERE source='pet') AS pet_count,
                       COUNT(*) FILTER (WHERE source='adoption') AS adoption_count
                FROM (
                    SELECT pet_breed AS breed, 'pet' AS source FROM pets WHERE approved = true
                    UNION ALL
                    SELECT pet_breed AS breed, 'adoption' FROM pets WHERE listing_type = 'adoption' AND approved = true
                ) t
                WHERE breed IS NOT NULL
                GROUP BY breed
                ORDER BY COUNT(*) DESC
                LIMIT 10
            `),
        ]);

        return NextResponse.json({
            trending_keywords: keywordsRes.rows.map((r) => ({
                keyword: r.keyword,
                post_count: Number(r.post_count) || 0,
                engagement_score: Number(r.engagement_score) || 0,
            })),
            media_posts: mediaPostsRes.rows,
            trending_breeds: breedsRes.rows,
        });

    } catch (error) {
        console.error("V1 Explore Discovery error:", error);
        return errorResponse("INTERNAL_ERROR", "An unhandled exception occurred", 500);
    }
}
