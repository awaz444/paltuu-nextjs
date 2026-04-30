import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/explore/search
 * Unified search across the entire platform
 *
 * Query params:
 *   q      — search query (required, min 1 char)
 *   type   — "all" | "users" | "pets" | "posts" | "products" | "adoptions" | "lost_found" | "hashtags" | "vets"
 *   limit  — per-type limit when type=all (default: 5, max: 10)
 *            per-page limit when type=specific (default: 20, max: 50)
 *   cursor — page offset for specific-type pagination
 */
export async function GET(req: NextRequest) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q")?.trim();
        const type = searchParams.get("type") || "all";
        const cursor = Math.max(0, parseInt(searchParams.get("cursor") || "0", 10));

        if (!q || q.length === 0) {
            return NextResponse.json({ error: "Query param 'q' is required" }, { status: 400 });
        }

        const safeQ: string = q;
        const isSpecific = type !== "all";
        const limit = isSpecific
            ? Math.min(50, parseInt(searchParams.get("limit") || "20", 10))
            : Math.min(10, parseInt(searchParams.get("limit") || "5", 10));

        const tsQuery = safeQ
            .split(/\s+/)
            .filter(Boolean)
            .map((w) => w + ":*") // prefix matching
            .join(" & ");

        // ── Users ────────────────────────────────────────────────────────────
        async function searchUsers(lim: number, offset: number) {
            const res = await db.query(`
                SELECT
                    'user'              AS entity_type,
                    u.user_id,
                    u.name,
                    u.social_username,
                    u.profile_image_url,
                    u.bio,
                    u.follower_count,
                    EXISTS(
                        SELECT 1 FROM social_follows
                        WHERE follower_id = $3 AND following_id = u.user_id
                    ) AS is_following
                FROM users u
                WHERE to_tsvector('english', u.name || ' ' || coalesce(u.social_username, ''))
                      @@ to_tsquery('english', $1)
                ORDER BY u.follower_count DESC
                LIMIT $2 OFFSET $4
            `, [tsQuery, lim, userId, offset]);
            return res.rows;
        }

        // ── Pets ─────────────────────────────────────────────────────────────
        async function searchPets(lim: number, offset: number) {
            const res = await db.query(`
                SELECT
                    'pet'               AS entity_type,
                    p.pet_id,
                    p.pet_name,
                    p.pet_breed AS breed,
                    p.pet_type,
                    p.image_url,
                    u.name              AS owner_name,
                    u.user_id           AS owner_id
                FROM pets p
                JOIN users u ON u.user_id = p.user_id
                WHERE to_tsvector('english', p.pet_name || ' ' || coalesce(p.pet_breed, '') || ' ' || coalesce(p.description, ''))
                      @@ to_tsquery('english', $1)
                ORDER BY p.pet_id DESC
                LIMIT $2 OFFSET $3
            `, [tsQuery, lim, offset]);
            return res.rows;
        }

        // ── Posts ────────────────────────────────────────────────────────────
        async function searchPosts(lim: number, offset: number) {
            const res = await db.query(`
                SELECT
                    'post'              AS entity_type,
                    p.post_id,
                    p.content,
                    p.like_count,
                    p.comment_count,
                    p.created_at,
                    u.name              AS author_name,
                    u.profile_image_url AS author_image,
                    u.user_id           AS author_id,
                    COALESCE(
                        (SELECT json_agg(m.* ORDER BY m.ordering)
                         FROM social_post_media m WHERE m.post_id = p.post_id),
                        '[]'::json
                    ) AS media
                FROM social_posts p
                JOIN users u ON u.user_id = p.user_id
                WHERE p.is_deleted = false
                  AND p.is_hidden = false
                  AND to_tsvector('english', coalesce(p.content, ''))
                      @@ to_tsquery('english', $1)
                ORDER BY p.created_at DESC
                LIMIT $2 OFFSET $3
            `, [tsQuery, lim, offset]);
            return res.rows;
        }

        // ── Products ─────────────────────────────────────────────────────────
        async function searchProducts(lim: number, offset: number) {
            const res = await db.query(`
                SELECT
                    'product'           AS entity_type,
                    p.product_id,
                    p.title             AS name,
                    p.price,
                    p.main_image        AS image_url,
                    p.status            AS availability,
                    v.shop_name         AS brand
                FROM bazaar_products p
                LEFT JOIN vendors v ON v.vendor_id = p.vendor_id
                WHERE p.status = 'active'
                  AND to_tsvector('english', p.title || ' ' || coalesce(p.description, ''))
                      @@ to_tsquery('english', $1)
                ORDER BY p.product_id DESC
                LIMIT $2 OFFSET $3
            `, [tsQuery, lim, offset]);
            return res.rows;
        }

        // ── Adoptions ────────────────────────────────────────────────────────
        async function searchAdoptions(lim: number, offset: number) {
            // Mapping: pets with adoption_status
            const res = await db.query(`
                SELECT
                    'adoption'          AS entity_type,
                    p.pet_id            AS listing_id,
                    p.pet_name,
                    p.pet_breed         AS breed,
                    p.age_value || ' ' || p.age_unit AS age,
                    p.location,
                    p.image_url,
                    p.adoption_status   AS status
                FROM pets p
                WHERE p.adoption_status IS NOT NULL
                  AND to_tsvector('english', p.pet_name || ' ' || coalesce(p.pet_breed, '') || ' ' || coalesce(p.description, ''))
                      @@ to_tsquery('english', $1)
                ORDER BY p.pet_id DESC
                LIMIT $2 OFFSET $3
            `, [tsQuery, lim, offset]);
            return res.rows;
        }

        // ── Lost & Found ─────────────────────────────────────────────────────
        async function searchLostFound(lim: number, offset: number) {
            const res = await db.query(`
                SELECT
                    'lost_found'        AS entity_type,
                    p.post_id           AS report_id,
                    p.pet_name,
                    p.pet_breed         AS breed,
                    p.post_type         AS report_type,
                    p.location          AS area,
                    COALESCE(
                        (SELECT url FROM lost_and_found_post_images WHERE post_id = p.post_id LIMIT 1),
                        NULL
                    ) AS image_url,
                    p.created_at
                FROM lost_and_found_posts p
                WHERE to_tsvector('english', coalesce(p.pet_description, '') || ' ' || coalesce(p.location, ''))
                      @@ to_tsquery('english', $1)
                ORDER BY p.created_at DESC
                LIMIT $2 OFFSET $3
            `, [tsQuery, lim, offset]);
            return res.rows;
        }

        // ── Hashtags ─────────────────────────────────────────────────────────
        async function searchHashtags(lim: number, offset: number) {
            const res = await db.query(`
                SELECT
                    'hashtag'   AS entity_type,
                    tag,
                    post_count
                FROM hashtags
                WHERE tag LIKE $1
                ORDER BY post_count DESC
                LIMIT $2 OFFSET $3
            `, [`${safeQ.toLowerCase().replace(/^#/, "")}%`, lim, offset]);
            return res.rows;
        }

        // ── Vets ─────────────────────────────────────────────────────────────
        async function searchVets(lim: number, offset: number) {
            // Join clinics and vets as per spec logic
            const res = await db.query(`
                SELECT
                    'vet'               AS entity_type,
                    c.clinic_id         AS provider_id,
                    c.name,
                    c.address           AS location,
                    c.logo_url          AS image_url,
                    COALESCE((SELECT AVG(rating) FROM vet_reviews WHERE clinic_id = c.clinic_id), 0) AS rating
                FROM clinics c
                WHERE to_tsvector('english', c.name || ' ' || coalesce(c.address, ''))
                      @@ to_tsquery('english', $1)
                ORDER BY rating DESC
                LIMIT $2 OFFSET $3
            `, [tsQuery, lim, offset]);
            return res.rows;
        }

        // ── Route by type ────────────────────────────────────────────────────
        if (isSpecific) {
            let results: any[] = [];
            if (type === "users")           results = await searchUsers(limit, cursor);
            else if (type === "pets")       results = await searchPets(limit, cursor);
            else if (type === "posts")      results = await searchPosts(limit, cursor);
            else if (type === "products")   results = await searchProducts(limit, cursor);
            else if (type === "adoptions")  results = await searchAdoptions(limit, cursor);
            else if (type === "lost_found") results = await searchLostFound(limit, cursor);
            else if (type === "hashtags")   results = await searchHashtags(limit, cursor);
            else if (type === "vets")       results = await searchVets(limit, cursor);
            else return NextResponse.json({ error: `Unknown type '${type}'` }, { status: 400 });

            const nextCursor = results.length === limit ? String(cursor + limit) : null;
            return NextResponse.json({ query: q, type, results, next_cursor: nextCursor });
        }

        // type === "all" — run all in parallel, cap at limit each
        const [users, pets, posts, products, adoptions, lost_found, hashtags, vets] = await Promise.all([
            searchUsers(limit, 0),
            searchPets(limit, 0),
            searchPosts(limit, 0),
            searchProducts(limit, 0),
            searchAdoptions(limit, 0),
            searchLostFound(limit, 0),
            searchHashtags(limit, 0),
            searchVets(limit, 0),
        ]);

        return NextResponse.json({
            query: q,
            type: "all",
            results: { users, pets, posts, products, adoptions, lost_found, hashtags, vets },
            next_cursor: null,
        });

    } catch (error) {
        console.error("V1 Explore Search error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
