import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { rateLimit } from "@/utils/rateLimit";

export const dynamic = "force-dynamic";

/**
 * Helper to encode cursor: base64(JSON.stringify({ id, created_at }))
 */
function encodeCursor(id: number | string, createdAt: Date | string | null) {
    if (!id || !createdAt) return null;
    const data = JSON.stringify({ id, created_at: createdAt });
    return Buffer.from(data).toString("base64");
}

/**
 * Helper to decode cursor
 */
function decodeCursor(cursor: string | null) {
    if (!cursor) return null;
    try {
        const decoded = Buffer.from(cursor, "base64").toString("utf8");
        return JSON.parse(decoded) as { id: number | string; created_at: string };
    } catch (e) {
        return null;
    }
}

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
 * GET /api/v1/explore/search
 * Unified search across the entire platform
 */
export async function GET(req: NextRequest) {
    try {
        // 1. Auth Guard
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return errorResponse("UNAUTHORIZED", "Missing or invalid JWT", 401);
        const userId = parseInt(String(userIdRaw), 10);

        // 2. Rate Limiting (60 requests per minute)
        const rl = await rateLimit(`explore_search:${userId}`, 60, 60);
        if (!rl.success) {
            return NextResponse.json(
                { error: { code: "RATE_LIMITED", message: "Too many requests. Please slow down.", status: 429 } },
                { status: 429, headers: { "Retry-After": "60" } }
            );
        }

        // 3. Input Validation
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q")?.trim() as string;
        const type = searchParams.get("type") || "all";
        const cursorStr = searchParams.get("cursor");
        const cursor = decodeCursor(cursorStr);

        if (!q || q.length === 0) {
            return errorResponse("INVALID_QUERY", "Search query 'q' is required", 400);
        }

        const validTypes = ["all", "users", "pets", "posts", "products", "adoptions", "lost_found", "hashtags", "vets", "breeds"];
        if (!validTypes.includes(type)) {
            return errorResponse("INVALID_TYPE", `Type param '${type}' not in allowed list`, 422);
        }

        const isSpecific = type !== "all";
        const limit = isSpecific
            ? Math.min(50, parseInt(searchParams.get("limit") || "20", 10))
            : Math.min(10, parseInt(searchParams.get("limit") || "5", 10));

        // Prepare FTS query
        const plainTsQuery = q; // plainto_tsquery handles the spacing/special chars

        // DB Setup: Statement Timeout
        await db.query("SET LOCAL statement_timeout = '2000ms'");

        // ── Entity Search Functions ──────────────────────────────────────────

        // Users
        async function searchUsers(lim: number, cur: any) {
            let query = `
                SELECT 'user' AS entity_type, u.user_id, u.name, u.social_username, u.profile_image_url, 
                       u.follower_count, u.created_at,
                       false AS is_blocked_by_me, false AS is_blocking_me,
                       EXISTS(SELECT 1 FROM social_follows WHERE follower_id = $3 AND following_id = u.user_id) AS is_following
                FROM users u
                WHERE to_tsvector('english', u.name || ' ' || coalesce(u.social_username, '')) @@ plainto_tsquery('english', $1)
                  AND NOT EXISTS (
                      SELECT 1 FROM user_blocks b 
                      WHERE (b.blocker_id = $3 AND b.blocked_id = u.user_id)
                         OR (b.blocker_id = u.user_id AND b.blocked_id = $3)
                  )
            `;
            const params: any[] = [plainTsQuery, lim + 1, userId];

            if (cur) {
                query += ` AND (u.created_at, u.user_id) < ($4, $5)`;
                params.push(cur.created_at, cur.id);
            }

            query += ` ORDER BY u.created_at DESC, u.user_id DESC LIMIT $2`;
            const res = await db.query(query, params);
            return res.rows;
        }

        // Pets
        async function searchPets(lim: number, cur: any) {
            let query = `
                SELECT 'pet' AS entity_type, p.pet_id, p.pet_name, p.pet_breed AS breed, p.image_url, p.created_at,
                       u.name AS owner_name, u.user_id AS owner_id
                FROM pets p
                JOIN users u ON u.user_id = p.owner_id
                WHERE to_tsvector('english', p.pet_name || ' ' || coalesce(p.pet_breed, '')) @@ plainto_tsquery('english', $1)
                  AND p.is_deleted = false
                  AND NOT EXISTS (
                      SELECT 1 FROM user_blocks b 
                      WHERE (b.blocker_id = $3 AND b.blocked_id = p.owner_id)
                         OR (b.blocker_id = p.owner_id AND b.blocked_id = $3)
                  )
            `;
            const params: any[] = [plainTsQuery, lim + 1, userId];

            if (cur) {
                query += ` AND (p.created_at, p.pet_id) < ($4, $5)`;
                params.push(cur.created_at, cur.id);
            }

            query += ` ORDER BY p.created_at DESC, p.pet_id DESC LIMIT $2`;
            const res = await db.query(query, params);
            return res.rows;
        }

        // Posts
        async function searchPosts(lim: number, cur: any) {
            let query = `
                SELECT 'post' AS entity_type, p.post_id, p.content, p.like_count, p.created_at,
                       u.name AS author_name,
                       false AS is_blocked_by_me, false AS is_blocking_me,
                       COALESCE((SELECT json_agg(m.*) FROM social_post_media m WHERE m.post_id = p.post_id), '[]'::json) AS media
                FROM social_posts p
                JOIN users u ON u.user_id = p.user_id
                WHERE to_tsvector('english', coalesce(p.content, '')) @@ plainto_tsquery('english', $1)
                  AND p.is_deleted = false
                  AND p.is_hidden = false
                  AND NOT EXISTS (
                      SELECT 1 FROM user_blocks b 
                      WHERE (b.blocker_id = $3 AND b.blocked_id = p.user_id)
                         OR (b.blocker_id = p.user_id AND b.blocked_id = $3)
                  )
            `;
            const params: any[] = [plainTsQuery, lim + 1, userId];

            if (cur) {
                query += ` AND (p.created_at, p.post_id) < ($4, $5)`;
                params.push(cur.created_at, cur.id);
            }

            query += ` ORDER BY p.created_at DESC, p.post_id DESC LIMIT $2`;
            const res = await db.query(query, params);
            return res.rows;
        }

        // Products
        async function searchProducts(lim: number, cur: any) {
            let query = `
                SELECT 'product' AS entity_type, p.product_id, p.title AS name, p.price, p.created_at,
                       (SELECT url FROM bazaar_product_media WHERE product_id = p.product_id AND is_primary = true LIMIT 1) AS image_url,
                       p.stock > 0 AS in_stock
                FROM bazaar_products p
                WHERE to_tsvector('english', p.title || ' ' || coalesce(p.description, '')) @@ plainto_tsquery('english', $1)
                  AND p.status = 'active'
            `;
            const params: any[] = [plainTsQuery, lim + 1];

            if (cur) {
                query += ` AND (p.created_at, p.product_id) < ($3, $4)`;
                params.push(cur.created_at, cur.id);
            }

            query += ` ORDER BY p.created_at DESC, p.product_id DESC LIMIT $2`;
            const res = await db.query(query, params);
            return res.rows;
        }

        // Adoptions
        async function searchAdoptions(lim: number, cur: any) {
            let query = `
                SELECT 'adoption' AS entity_type, p.pet_id AS listing_id, p.pet_name, p.pet_breed AS breed, p.location, p.adoption_status AS status, p.created_at
                FROM pets p
                WHERE p.listing_type = 'adoption'
                  AND p.is_deleted = false
                  AND to_tsvector('english', p.pet_name || ' ' || coalesce(p.pet_breed, '') || ' ' || coalesce(p.location, '')) @@ plainto_tsquery('english', $1)
                  AND NOT EXISTS (
                      SELECT 1 FROM user_blocks b 
                      WHERE (b.blocker_id = $3 AND b.blocked_id = p.owner_id)
                         OR (b.blocker_id = p.owner_id AND b.blocked_id = $3)
                  )
            `;
            const params: any[] = [plainTsQuery, lim + 1, userId];

            if (cur) {
                query += ` AND (p.created_at, p.pet_id) < ($4, $5)`;
                params.push(cur.created_at, cur.id);
            }

            query += ` ORDER BY p.created_at DESC, p.pet_id DESC LIMIT $2`;
            const res = await db.query(query, params);
            return res.rows;
        }

        // Lost & Found
        async function searchLostFound(lim: number, cur: any) {
            let query = `
                SELECT 'lost_found' AS entity_type, p.post_id AS report_id, p.pet_name, p.post_type AS report_type, p.location AS area, p.created_at,
                       (SELECT image_url FROM lost_and_found_post_images WHERE post_id = p.post_id LIMIT 1) AS image_url
                FROM lost_and_found_posts p
                WHERE to_tsvector('english', coalesce(p.pet_description, '') || ' ' || coalesce(p.location, '')) @@ plainto_tsquery('english', $1)
                  AND p.status = 'active'
            `;
            const params: any[] = [plainTsQuery, lim + 1];

            if (cur) {
                query += ` AND (p.created_at, p.post_id) < ($3, $4)`;
                params.push(cur.created_at, cur.id);
            }

            query += ` ORDER BY p.created_at DESC, p.post_id DESC LIMIT $2`;
            const res = await db.query(query, params);
            return res.rows;
        }

        // Hashtags
        async function searchHashtags(lim: number, cur: any) {
            const cleanQ = q.replace(/^#/, "").toLowerCase();
            let query = `
                SELECT 'hashtag' AS entity_type, tag, post_count, created_at, hashtag_id
                FROM hashtags
                WHERE tag LIKE $1 || '%' AND post_count > 0
            `;
            const params: any[] = [cleanQ, lim + 1];

            if (cur) {
                query += ` AND (post_count, hashtag_id) < ($3, $4)`;
                params.push(cur.post_count, cur.id);
            }

            query += ` ORDER BY post_count DESC, hashtag_id DESC LIMIT $2`;
            const res = await db.query(query, params);
            return res.rows;
        }

        // Vets
        async function searchVets(lim: number, cur: any) {
            let query = `
                SELECT 'vet' AS entity_type, c.clinic_id AS provider_id, c.name, c.address AS location, c.logo_url AS image_url, c.created_at,
                       COALESCE((SELECT AVG(rating) FROM vet_reviews WHERE clinic_id = c.clinic_id), 0) AS rating
                FROM clinics c
                WHERE to_tsvector('english', c.name || ' ' || coalesce(c.address, '')) @@ plainto_tsquery('english', $1)
            `;
            const params: any[] = [plainTsQuery, lim + 1];

            if (cur) {
                query += ` AND (c.created_at, c.clinic_id) < ($3, $4)`;
                params.push(cur.created_at, cur.id);
            }

            query += ` ORDER BY c.created_at DESC, c.clinic_id DESC LIMIT $2`;
            const res = await db.query(query, params);
            return res.rows;
        }

        // Breeds (Derived)
        async function searchBreeds(lim: number, cur: any) {
            let query = `
                SELECT 'breed' AS entity_type, breed, 
                       COUNT(*) FILTER (WHERE source='pet') AS pet_count,
                       COUNT(*) FILTER (WHERE source='adoption') AS adoption_count,
                       SUM(COUNT(*)) OVER() as total_results
                FROM (
                    SELECT pet_breed as breed, 'pet' AS source FROM pets WHERE is_deleted = false
                    UNION ALL
                    SELECT pet_breed as breed, 'adoption' FROM pets WHERE listing_type = 'adoption' AND is_deleted = false
                ) t
                WHERE breed IS NOT NULL AND breed ILIKE $1 || '%'
                GROUP BY breed
            `;
            const params: any[] = [q, lim + 1];

            if (cur) {
                query += ` HAVING breed > $3`; // Simple alphabetical pagination for breeds
                params.push(cur.id);
            }

            query += ` ORDER BY breed ASC LIMIT $2`;
            const res = await db.query(query, params);
            return res.rows;
        }

        // ── Route by type ────────────────────────────────────────────────────
        if (isSpecific) {
            let rawResults: any[] = [];
            if (type === "users")           rawResults = await searchUsers(limit, cursor);
            else if (type === "pets")       rawResults = await searchPets(limit, cursor);
            else if (type === "posts")      rawResults = await searchPosts(limit, cursor);
            else if (type === "products")   rawResults = await searchProducts(limit, cursor);
            else if (type === "adoptions")  rawResults = await searchAdoptions(limit, cursor);
            else if (type === "lost_found") rawResults = await searchLostFound(limit, cursor);
            else if (type === "hashtags")   rawResults = await searchHashtags(limit, cursor);
            else if (type === "vets")       rawResults = await searchVets(limit, cursor);
            else if (type === "breeds")     rawResults = await searchBreeds(limit, cursor);

            const hasMore = rawResults.length > limit;
            const results = hasMore ? rawResults.slice(0, limit) : rawResults;
            
            let nextCursor = null;
            if (hasMore) {
                const lastItem = results[results.length - 1];
                if (type === "hashtags") {
                    nextCursor = encodeCursor(lastItem.hashtag_id, lastItem.post_count);
                } else if (type === "breeds") {
                    nextCursor = encodeCursor(lastItem.breed, "0");
                } else {
                    const idField = lastItem.user_id || lastItem.pet_id || lastItem.post_id || lastItem.product_id || lastItem.listing_id || lastItem.report_id || lastItem.provider_id || lastItem.clinic_id;
                    nextCursor = encodeCursor(idField, lastItem.created_at);
                }
            }

            return NextResponse.json({ query: q, type, results, next_cursor: nextCursor });
        }

        // type === "all" — run all in parallel, cap at limit each
        const [users, pets, posts, products, adoptions, lost_found, hashtags, vets] = await Promise.all([
            searchUsers(limit, null).then(r => r.slice(0, limit)),
            searchPets(limit, null).then(r => r.slice(0, limit)),
            searchPosts(limit, null).then(r => r.slice(0, limit)),
            searchProducts(limit, null).then(r => r.slice(0, limit)),
            searchAdoptions(limit, null).then(r => r.slice(0, limit)),
            searchLostFound(limit, null).then(r => r.slice(0, limit)),
            searchHashtags(limit, null).then(r => r.slice(0, limit)),
            searchVets(limit, null).then(r => r.slice(0, limit)),
        ]);

        return NextResponse.json({
            query: q,
            type: "all",
            results: { users, pets, posts, products, adoptions, lost_found, hashtags, vets },
            next_cursor: null,
        });

    } catch (error) {
        console.error("V1 Explore Search error:", error);
        return errorResponse("INTERNAL_ERROR", "An unhandled exception occurred", 500);
    }
}
