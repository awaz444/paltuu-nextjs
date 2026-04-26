import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkVendor } from "../vendorAuth";

export const dynamic = "force-dynamic";

// GET /api/v1/vendors/catalogue
// Browse master catalogue with inventory status for vendor
export async function GET(req: NextRequest) {
    try {
        const auth = await checkVendor(req);
        if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const vendorId = auth.vendor.vendor_id;
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
        const offset = (page - 1) * limit;
        const animal_type = searchParams.get("animal_type");
        const keyword = searchParams.get("keyword");

        let queryStr = `
            SELECT p.*,
                COALESCE((SELECT json_agg(url ORDER BY ordering) FROM bazaar_product_media m WHERE m.product_id = p.product_id), '[]'::json) AS images,
                EXISTS(SELECT 1 FROM vendor_inventory vi WHERE vi.product_id = p.product_id AND vi.vendor_id = $1) as in_inventory,
                (SELECT json_build_object(
                    'inventory_id', vi.inventory_id, 
                    'selling_price', vi.selling_price, 
                    'original_price', vi.original_price, 
                    'discount_percent', vi.discount_percent, 
                    'is_available', vi.is_available, 
                    'stock_count', vi.stock_count
                ) FROM vendor_inventory vi WHERE vi.product_id = p.product_id AND vi.vendor_id = $1 LIMIT 1) as inventory_data
            FROM bazaar_products p
            WHERE p.is_master_catalogue = true AND p.status = 'published'
        `;
        const params: any[] = [vendorId];
        let pIdx = 2;

        if (animal_type && animal_type !== "all") { params.push(animal_type); queryStr += ` AND p.animal_type = $${pIdx++}`; }
        if (keyword) { params.push(`%${keyword}%`); queryStr += ` AND (p.title ILIKE $${pIdx} OR p.description ILIKE $${pIdx} OR p.brand ILIKE $${pIdx++})`; }

        queryStr += ` ORDER BY p.created_at DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
        const result = await db.query(queryStr, [...params, limit, offset]);

        let countQuery = `SELECT COUNT(*)::int FROM bazaar_products WHERE is_master_catalogue = true AND status = 'published'`;
        const countParams: any[] = [];
        let cIdx = 1;

        if (animal_type && animal_type !== "all") { countParams.push(animal_type); countQuery += ` AND animal_type = $${cIdx++}`; }
        if (keyword) { countParams.push(`%${keyword}%`); countQuery += ` AND (title ILIKE $${cIdx} OR description ILIKE $${cIdx} OR brand ILIKE $${cIdx++})`; }

        const countRes = await db.query(countQuery, countParams);
        const total = countRes.rows[0].count;

        return NextResponse.json({ rows: result.rows, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });

    } catch (error: any) {
        console.error("Vendor Catalogue GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
