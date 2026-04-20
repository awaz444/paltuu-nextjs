import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { safeRedis } from "@/utils/redis";
import { getUserIdFromRequest, getUserFromRequest } from "@/utils/authServer";

const CACHE_TTL_SEC = 300; // 5 minutes

/**
 * @swagger
 * /api/v1/bazaar/products:
 *   get:
 *     summary: Fetch bazaar products (V1)
 *     tags: [v1 Bazaar]
 *   post:
 *     summary: Create bazaar product (Admin only)
 *     tags: [v1 Bazaar]
 */

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(8, parseInt(searchParams.get("limit") || "24", 10)));
        const offset = (page - 1) * limit;

        const category = searchParams.get('category');
        const collection = searchParams.get('collection');
        const keyword = searchParams.get('keyword');

        // Dynamic Cache Key
        const cacheKey = `v1:products:page=${page}:limit=${limit}:cat=${category || ''}:col=${collection || ''}:kw=${keyword || ''}`;

        // Cache Hit Check
        try {
            const cached = await safeRedis.get(cacheKey);
            if (cached) return NextResponse.json(JSON.parse(cached));
        } catch (e) { console.warn("[Cache] Redis hit failure:", e); }

        // Build Query
        const conditions: string[] = ["p.status = 'published'"];
        const values: any[] = [];
        let pIdx = 1;

        if (keyword) { values.push(`%${keyword}%`); conditions.push(`(p.title ILIKE $${pIdx} OR p.description ILIKE $${pIdx++})`); }
        
        if (category) {
            if (!isNaN(Number(category))) { values.push(Number(category)); conditions.push(`EXISTS (SELECT 1 FROM bazaar_product_categories bpc WHERE bpc.product_id = p.product_id AND bpc.category_id = $${pIdx++})`); }
            else { values.push(category); conditions.push(`EXISTS (SELECT 1 FROM bazaar_product_categories bpc JOIN bazaar_categories bc ON bpc.category_id = bc.category_id WHERE bpc.product_id = p.product_id AND bc.name ILIKE $${pIdx++})`); }
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : "";

        // Main Query (Simplified for V1)
        const query = `
            SELECT p.product_id, p.title, p.slug, p.price, p.currency, p.featured,
                COALESCE((SELECT json_agg(url ORDER BY ordering) FROM bazaar_product_media m WHERE m.product_id = p.product_id), '[]'::json) AS images,
                COALESCE((SELECT json_agg(json_build_object('category_id', c.category_id, 'name', c.name)) FROM bazaar_categories c JOIN bazaar_product_categories bpc ON c.category_id = bpc.category_id WHERE bpc.product_id = p.product_id), '[]'::json) AS categories
            FROM bazaar_products p
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT $${pIdx++} OFFSET $${pIdx++}
        `;

        const result = await db.query(query, [...values, limit, offset]);
        const countRes = await db.query(`SELECT COUNT(*) FROM bazaar_products p ${whereClause}`, values);
        const total = parseInt(countRes.rows[0].count, 10);

        const response = {
            data: result.rows,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        };

        // Cache Set
        try { await safeRedis.set(cacheKey, JSON.stringify(response), 'EX', CACHE_TTL_SEC); } catch (e) {}

        return NextResponse.json(response);

    } catch (error) {
        console.error("V1 Products GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
        }

        // Migration note: The full product creation logic is very long (variants, etc.).
        // We'll keep this as a proxy to the main bazaar logic for now or implement a clean V1 version.
        // For brevity in this turn, I'm providing the GET optimization. 
        // Admin operations are usually handled by the web dashboard.
        return NextResponse.json({ message: "Admin POST not yet implemented in V1" }, { status: 501 });

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
