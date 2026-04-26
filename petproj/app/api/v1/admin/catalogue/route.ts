import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "../adminAuth";

export const dynamic = "force-dynamic";

// GET /api/v1/admin/catalogue
// Paginated list of all master products
export async function GET(req: NextRequest) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
        const offset = (page - 1) * limit;

        const status = searchParams.get("status");
        const animal_type = searchParams.get("animal_type");
        const keyword = searchParams.get("keyword");

        let queryStr = `
            SELECT p.*,
                COALESCE((SELECT count(*)::int FROM bazaar_product_variants v WHERE v.product_id = p.product_id), 0) as variants_count,
                COALESCE((SELECT json_agg(url ORDER BY ordering) FROM bazaar_product_media m WHERE m.product_id = p.product_id), '[]'::json) AS images
            FROM bazaar_products p
            WHERE is_master_catalogue = true
        `;
        const params: any[] = [];
        let pIdx = 1;

        if (status && status !== "all") {
            params.push(status);
            queryStr += ` AND p.status = $${pIdx++}`;
        } else {
            queryStr += ` AND p.status != 'archived'`;
        }

        if (animal_type && animal_type !== "all") {
            params.push(animal_type);
            queryStr += ` AND p.animal_type = $${pIdx++}`;
        }

        if (keyword) {
            params.push(`%${keyword}%`);
            queryStr += ` AND (p.title ILIKE $${pIdx} OR p.description ILIKE $${pIdx} OR p.brand ILIKE $${pIdx++})`;
        }

        queryStr += ` ORDER BY p.created_at DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;

        const result = await db.query(queryStr, [...params, limit, offset]);

        let countQuery = `SELECT COUNT(*)::int FROM bazaar_products WHERE is_master_catalogue = true`;
        const countParams: any[] = [];
        let cIdx = 1;

        if (status && status !== "all") {
            countParams.push(status);
            countQuery += ` AND status = $${cIdx++}`;
        } else {
            countQuery += ` AND status != 'archived'`;
        }

        if (animal_type && animal_type !== "all") {
            countParams.push(animal_type);
            countQuery += ` AND animal_type = $${cIdx++}`;
        }

        if (keyword) {
            countParams.push(`%${keyword}%`);
            countQuery += ` AND (title ILIKE $${cIdx} OR description ILIKE $${cIdx} OR brand ILIKE $${cIdx++})`;
        }

        const countRes = await db.query(countQuery, countParams);
        const total = countRes.rows[0].count;

        return NextResponse.json({
            rows: result.rows,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });

    } catch (error: any) {
        console.error("Admin Catalogue GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/v1/admin/catalogue
// Create new master product
export async function POST(req: NextRequest) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { title, description, brand, animal_type, shipping_weight, min_order_qty, max_order_qty, status = 'draft', slug: customSlug } = body;

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const slug = customSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const queryStr = `
            INSERT INTO bazaar_products (
                title, slug, description, brand, animal_type, 
                shipping_weight, min_order_qty, max_order_qty, status, 
                is_master_catalogue, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
            RETURNING *
        `;

        const result = await db.query(queryStr, [
            title, slug, description, brand, animal_type, 
            shipping_weight, min_order_qty || 1, max_order_qty || null, status
        ]);

        return NextResponse.json(result.rows[0], { status: 201 });

    } catch (error: any) {
        console.error("Admin Catalogue POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
