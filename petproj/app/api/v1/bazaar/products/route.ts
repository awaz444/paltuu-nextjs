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
        const isAdminRequest = searchParams.get('admin') === 'true';

        // Auth check for admin request
        let finalIsAdmin = false;
        if (isAdminRequest) {
            const user = await getUserFromRequest(req);
            if (user?.role === 'admin') finalIsAdmin = true;
        }

        // Build Query
        const conditions: string[] = [];
        const values: any[] = [];
        let pIdx = 1;

        if (!finalIsAdmin) {
            conditions.push("p.status = 'published'");
        } else {
            const status = searchParams.get('status');
            if (status && status !== 'all') {
                values.push(status);
                conditions.push(`p.status = $${pIdx++}`);
            }
        }

        if (keyword) { 
            values.push(`%${keyword}%`); 
            conditions.push(`(p.title ILIKE $${pIdx} OR p.description ILIKE $${pIdx++})`); 
        }
        
        if (category) {
            values.push(category);
            conditions.push(`EXISTS (SELECT 1 FROM bazaar_product_categories bpc JOIN bazaar_categories bc ON bpc.category_id = bc.category_id WHERE bpc.product_id = p.product_id AND (bc.name ILIKE $${pIdx} OR bc.slug = $${pIdx++}))`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : "";

        // Main Query
        const query = `
            SELECT p.*,
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
            rows: result.rows,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        };

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

        const body = await req.json();
        const { title, description, price, sku, category_id, status = 'draft' } = body;

        if (!title || !price) {
            return NextResponse.json({ error: "Title and price are required" }, { status: 400 });
        }

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const query = `
            INSERT INTO bazaar_products (title, slug, description, price, sku, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING *
        `;

        const result = await db.query(query, [title, slug, description, price, sku, status]);
        const product = result.rows[0];

        if (category_id) {
            await db.query(`INSERT INTO bazaar_product_categories (product_id, category_id) VALUES ($1, $2)`, [product.product_id, category_id]);
        }

        return NextResponse.json(product, { status: 201 });

    } catch (error) {
        console.error("V1 Products POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

